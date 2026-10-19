import { toSummary, type Row } from "./app-summary";
import type { AppSummary } from "./catalog-types";

// The homepage's rows of cards, loaded by the browser from `/api/home/`
// rather than rendered by the Worker. Rendering and serializing ~340 cards
// cost ~1 s of Worker CPU per homepage render in production (Workers Logs,
// 2026-10-19), against a 10 ms limit on the free plan. The data was never
// the cost: each row is one precomputed `listingRows:*` meta row, which
// the endpoint sends as stored, so the Worker only concatenates strings.

/** Each row's precomputed listing (`listingRows:<key>` in catalog's `meta`). */
export const HOME_LISTINGS = {
  trendingApps: "trending:app",
  trendingGames: "trending:game",
  downloadTrends: "downloadTrending:all",
  newGames: "newApps:game",
  productivity: "categoryPreview:Productivity",
  music: "categoryPreview:Music & Audio",
  creativity: "categoryPreview:Graphics & Design",
  learning: "categoryPreview:Education",
  video: "categoryPreview:Photo & Video",
  casualGames: "categoryPreview:Casual",
  puzzleGames: "categoryPreview:Puzzle",
} as const;

export type HomeRowName = keyof typeof HOME_LISTINGS | "mustHave";

/**
 * Hand-picked, not category-derived — there's no "must-have" signal in the
 * data model, so this is genuinely editorial, same spirit as
 * influencer-pages.json. Real catalog ids, capped at 15; the order is the
 * display order. Bare ids: a Snap or Flatpak package's own name is already
 * the app's canonical id (catalog's match/group.ts).
 */
export const MUST_HAVE_APP_IDS = [
  "firefox",
  "zen-browser-snap",
  "vlc",
  "libreoffice",
  "thunderbird",
  "discord",
  "signal-desktop",
  "gimp",
  "inkscape",
  "krita",
  "blender",
  "kdenlive",
  "audacity",
  "obs-studio",
  "keepassxc",
] as const;

/** Cards a row shows: five or six at a time, then "Browse everything". The listings hold 60. */
export const HOME_ROW_SIZE = 16;

export type HomeRows = Record<HomeRowName, AppSummary[]>;

const rowsOf = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : []);

/**
 * `/api/home/`'s body as rows of cards: each listing cut to `HOME_ROW_SIZE`,
 * the must-haves in `MUST_HAVE_APP_IDS` order. A missing or malformed row
 * is an empty one (the row says so), never a throw.
 */
export function parseHomeRows(body: unknown): HomeRows {
  const raw = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const rows = Object.fromEntries(
    Object.entries(HOME_LISTINGS).map(([name, key]) => [
      name,
      rowsOf(raw[key]).slice(0, HOME_ROW_SIZE).map(toSummary),
    ]),
  ) as Record<keyof typeof HOME_LISTINGS, AppSummary[]>;
  const mustHave = new Map(rowsOf(raw.mustHave).map((row) => [String(row.id), toSummary(row)]));
  return {
    ...rows,
    mustHave: MUST_HAVE_APP_IDS.flatMap((id) => mustHave.get(id) ?? []),
  };
}

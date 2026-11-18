import { toSummary, type Row } from "./app-summary";
import type { AppSummary } from "./catalog-types";

// The homepage's rows of cards, loaded by the browser from `/api/home/`
// rather than rendered by the Worker. Rendering and serializing ~340 cards
// cost ~1 s of Worker CPU per homepage render in production (Workers Logs,
// 2026-10-19), against a 10 ms limit on the free plan. The data was never
// the cost: each row is one precomputed `listingRows:*` meta row, which
// the endpoint sends as stored, so the Worker only concatenates strings.

/** The two halves of the homepage, apps first, each a heading over its rows. */
export const HOME_SECTIONS = [
  { id: "apps", title: "Apps", href: "/apps/", linkLabel: "All apps" },
  { id: "games", title: "Games", href: "/games/", linkLabel: "All games" },
] as const;

export type HomeSectionId = (typeof HOME_SECTIONS)[number]["id"];

/**
 * The hand-picked row's listing: catalog's `config/home-must-have.json`,
 * published in its own order as `listingRows:mustHave`. Pinned to
 * store-contract.json's `mustHaveListing`.
 */
export const MUST_HAVE = "mustHave";

/**
 * The games rated for all ages (age bracket 3), most popular first:
 * catalog's `listingRows:familyGames`. Pinned to store-contract.json's
 * `familyGamesListing`.
 */
export const FAMILY_GAMES = "familyGames";

export interface HomeRow {
  section: HomeSectionId;
  title: string;
  /**
   * Where the cards come from: catalog's precomputed `listingRows:<listing>`
   * meta row (`trending:app`, `categoryPreview:Racing`, `MUST_HAVE`, ...),
   * one read each.
   */
  listing: string;
  /** Where the row's "Browse" link leads; none for the hand-picked must-haves. */
  href?: string;
  /**
   * A category or genre row: drawn only when the published catalog lists
   * that category (its `categoryCounts`), so the site can name one before
   * catalog publishes it, and a retired one leaves no empty box.
   */
  category?: string;
  /** What the row is sorted by, shown on an info icon next to its title. */
  tip?: string;
  /**
   * A sentence on what the row holds, for the pages that draw it as an
   * editorial collection rather than a plain row (/games' family games).
   */
  blurb?: string;
  /** Shown when the listing is empty. Without one, an empty row is left out. */
  emptyMessage?: string;
}

const TRENDING_TIP =
  "Ranked by popularity across the sources that publish it (the AUR's usage ranking, Debian's popcon, Arch's pkgstats, Homebrew's install counts, the stars of the app's GitHub repository): apps popular in several of them come first.";
const NEW_GAMES_TIP =
  "Sorted by each source's own newest-release date (Flathub/AppCenter's AppStream <releases> timestamp) — not every app has one, so this skews toward Flatpak-packaged games.";
const FAMILY_GAMES_TIP =
  "Games rated for all ages (PEGI 3, or an AppStream content rating with nothing to declare), most popular first. Unrated games can't appear here.";
const RECENTLY_UPDATED_TIP =
  "Sorted by the date of the app's newest release, as its AppStream metadata (Flathub, AppCenter, Fedora, openSUSE, Arch) or its GitHub releases state it. Apps no source dates can't appear here.";

/** A row of one category's most popular apps (catalog's `categoryPreview:<category>`, 12 with an icon). */
const categoryRow = (section: HomeSectionId, title: string, category: string): HomeRow => ({
  section,
  title,
  category,
  listing: `categoryPreview:${category}`,
  href: `/browse/?category=${encodeURIComponent(category)}`,
});

/**
 * Every row of the homepage, in display order within its section. Adding
 * a row is one line here: a category row with `categoryRow(...)`, any
 * other precomputed listing as a `HomeRow`. App category rows follow the
 * /categories groups (`APP_CATEGORY_GROUPS`), game genres come after the
 * game-wide rows. A category has a row when its listing is full of apps
 * people come looking for; the others (Social Media, Email, Utilities,
 * Security, the smaller genres...) are one tap away in the category chips
 * and grid. Visual Novel has no row: mostly adult titles.
 */
export const HOME_ROWS: readonly HomeRow[] = [
  {
    section: "apps",
    title: "Trending apps",
    listing: "trending:app",
    href: "/browse/?type=app",
    tip: TRENDING_TIP,
    emptyMessage: "No trending data available yet.",
  },
  {
    section: "apps",
    title: "Must-have apps",
    listing: MUST_HAVE,
    emptyMessage: "No must-have apps catalogued yet.",
  },
  {
    section: "apps",
    title: "Recently updated apps",
    listing: "newApps:app",
    href: "/browse/?type=app",
    tip: RECENTLY_UPDATED_TIP,
    emptyMessage: "No release-date data available yet.",
  },
  // Internet & communication
  categoryRow("apps", "Web browsers", "Web Browsers"),
  categoryRow("apps", "Messaging & calls", "Messaging & Calls"),
  categoryRow("apps", "File sharing & downloads", "File Sharing & Downloads"),
  // Create
  categoryRow("apps", "Graphics & design apps", "Graphics & Design"),
  categoryRow("apps", "Photo & video apps", "Photo & Video"),
  categoryRow("apps", "Music apps", "Music & Audio"),
  // Work
  categoryRow("apps", "Productivity apps", "Productivity"),
  categoryRow("apps", "AI assistants", "AI"),
  // Learn & discover
  categoryRow("apps", "Learning apps", "Education"),
  categoryRow("apps", "Science apps", "Science"),
  // System & development
  categoryRow("apps", "Developer tools", "Developer Tools"),
  categoryRow("apps", "System tools", "System Tools"),

  {
    section: "games",
    title: "Trending games",
    listing: "trending:game",
    href: "/browse/?type=game",
    tip: TRENDING_TIP,
    emptyMessage: "No trending data available yet.",
  },
  {
    section: "games",
    title: "New games",
    listing: "newApps:game",
    href: "/browse/?type=game",
    tip: NEW_GAMES_TIP,
    emptyMessage: "No release-date data available yet.",
  },
  {
    section: "games",
    title: "Games for the whole family",
    listing: FAMILY_GAMES,
    href: "/browse/?type=game&age=3",
    tip: FAMILY_GAMES_TIP,
    blurb: "Rated for every age: games to play with the kids, most popular first.",
  },
  // Around games (an app category, listed with the games)
  categoryRow("games", "Emulators & game tools", "Gaming Tools"),
  categoryRow("games", "Action games", "Action"),
  categoryRow("games", "Shooters", "Shooter"),
  categoryRow("games", "Role-playing games", "Role-Playing"),
  categoryRow("games", "Strategy games", "Strategy"),
  categoryRow("games", "Simulation games", "Simulation"),
  categoryRow("games", "Racing games", "Racing"),
  categoryRow("games", "Puzzle games", "Puzzle"),
  categoryRow("games", "Board & card games", "Board & Cards"),
  categoryRow("games", "Music & rhythm games", "Music & Rhythm"),
];

/** The precomputed listings the rows read (`listingRows:<listing>`), each once. */
export const HOME_LISTINGS: readonly string[] = [...new Set(HOME_ROWS.map((row) => row.listing))];

/** Cards a row shows: five or six at a time, then "Browse". Trending listings hold 60, category ones 12. */
export const HOME_ROW_SIZE = 16;

/** Each row's cards, by its `listing`. */
export type HomeRows = Record<string, AppSummary[]>;

const rowsOf = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : []);

/**
 * `/api/home/`'s body as rows of cards, by listing, each cut to
 * `HOME_ROW_SIZE` in the order catalog published it. A missing or
 * malformed listing is an empty row, never a throw.
 */
export function parseHomeRows(body: unknown): HomeRows {
  const raw = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  return Object.fromEntries(
    HOME_LISTINGS.map((listing) => [
      listing,
      rowsOf(raw[listing]).slice(0, HOME_ROW_SIZE).map(toSummary),
    ]),
  );
}

/**
 * The rows of one section the page draws: a category row only when the
 * published catalog lists its category (`available`, from the
 * `categoryCounts` the page reads anyway), every other row always.
 */
export function homeRowsOf(section: HomeSectionId, available: ReadonlySet<string>): HomeRow[] {
  return HOME_ROWS.filter(
    (row) => row.section === section && (row.category === undefined || available.has(row.category)),
  );
}

/** `a` and `b` taken in turn, the longer one's rest at the end. */
export function interleave<T>(a: readonly T[], b: readonly T[]): T[] {
  return Array.from({ length: Math.max(a.length, b.length) }, (_, i) => [a[i], b[i]])
    .flat()
    .filter((item): item is T => item !== undefined);
}

/**
 * The category rows of both sections that the published catalog lists,
 * an app category and a game genre in turn: what the homepage's Explore
 * tiles and shelves of the day rotate through.
 */
export function mixedCategoryRows(available: ReadonlySet<string>): HomeRow[] {
  const of = (section: HomeSectionId) =>
    homeRowsOf(section, available).filter((row) => row.category !== undefined);
  return interleave(of("apps"), of("games"));
}

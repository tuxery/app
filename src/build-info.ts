import { safeParseStrict } from "helpers4/json";

// What the footer says about where the site and its data come from: no
// hand-bumped version number (nobody installs this, and one that someone
// must remember to change stays put), but the commit that built each part,
// and how old the data is. Pure on purpose, so the formats are unit-tested.
// The catalog side is `tuxery/catalog`'s `meta.buildInfo` (BuildInfo in
// src/pipeline/build-info.ts there), mirrored by hand like the other
// catalog contracts.

/** Key of the `meta` row holding the catalog's `BuildInfo` JSON. Absent on a dataset published before it existed. */
export const BUILD_INFO_META_KEY = "buildInfo";

export interface CatalogBuildInfo {
  /** The commit of `tuxery/catalog` that built the dataset, and its commit date (ISO, UTC). */
  catalog?: { commit: string; date: string };
  /** The oldest and newest source fetch among the dataset's caches (ISO, UTC). */
  sources?: { oldest: string; newest: string };
}

function isIso(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/** Parses the `buildInfo` row's JSON, keeping only the well-formed parts — `undefined` when none is (never a throw). */
export function parseBuildInfo(value: unknown): CatalogBuildInfo | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = safeParseStrict<{
    catalog?: { commit?: unknown; date?: unknown };
    sources?: { oldest?: unknown; newest?: unknown };
  }>(value);
  if (!parsed) return undefined;
  const { catalog, sources } = parsed;
  const info: CatalogBuildInfo = {};
  if (typeof catalog?.commit === "string" && catalog.commit && isIso(catalog.date)) {
    info.catalog = { commit: catalog.commit, date: catalog.date };
  }
  if (isIso(sources?.oldest) && isIso(sources?.newest)) {
    info.sources = { oldest: sources.oldest, newest: sources.newest };
  }
  return info.catalog || info.sources ? info : undefined;
}

/** "2026.10.12": a commit date as a version, sortable and readable. UTC like every date the catalog stores. */
export function versionOf(isoDate: string): string {
  return isoDate.slice(0, 10).replaceAll("-", ".");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const month = (date: Date) => MONTHS[date.getUTCMonth()];
const day = (date: Date) => String(date.getUTCDate());

/**
 * "12 Oct 2026", "10–12 Oct 2026", "30 Sep – 2 Oct 2026", "28 Dec 2026 –
 * 3 Jan 2027": the span of the data's age, as short as it can be. UTC.
 */
export function formatDateRange(fromIso: string, toIso: string): string {
  const [from, to] = [new Date(fromIso), new Date(toIso)];
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const sameMonth = sameYear && from.getUTCMonth() === to.getUTCMonth();
  if (sameMonth && from.getUTCDate() === to.getUTCDate()) {
    return `${day(to)} ${month(to)} ${to.getUTCFullYear()}`;
  }
  if (sameMonth) return `${day(from)}–${day(to)} ${month(to)} ${to.getUTCFullYear()}`;
  if (sameYear) {
    return `${day(from)} ${month(from)} – ${day(to)} ${month(to)} ${to.getUTCFullYear()}`;
  }
  return `${day(from)} ${month(from)} ${from.getUTCFullYear()} – ${day(to)} ${month(to)} ${to.getUTCFullYear()}`;
}

export function commitUrl(repo: "app" | "catalog", commit: string): string {
  return `https://github.com/tuxery/${repo}/commit/${commit}`;
}

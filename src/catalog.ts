import { createClient, type Client } from "@libsql/client";
import {
  BROWSE_PAGE_SIZE,
  EMPTY_STATS,
  summarizeChannels,
  summarizeRatingsBySource,
  type AppSummary,
  type BrowseResult,
  type CatalogApp,
  type CatalogStats,
  type PackageSourceId,
  type SourcedPackage,
} from "~/catalog-types";

// Server-only half of the catalog layer — everything here touches the DB
// (`@libsql/client`, a Node-only driver), so it must only ever be referenced
// inside a routeLoader$/RequestHandler `$` callback. Pure types/constants
// safe to import from client-rendered components live in `~/catalog-types`
// instead — see that file's header comment for why the split exists.

const MAX_RESULTS = 60;

// A single reused client for the process's lifetime — cheap for the HTTP
// transport this always uses (a local `turso dev` server or the real
// hosted DB, never a local file), no connection pool to manage.
let client: Client | null | undefined;

/** `undefined` TURSO_DB_URL (e.g. catalog's `pnpm serve` never ran) degrades to an empty catalog rather than throwing. */
function getClient(): Client | null {
  if (client !== undefined) return client;
  const url = process.env.TURSO_DB_URL;
  client = url ? createClient({ url, authToken: process.env.TURSO_DB_AUTH_TOKEN }) : null;
  return client;
}

/** A reachable-but-not-actually-running local `turso dev` server (connection refused, etc.) degrades the same way as no TURSO_DB_URL at all, rather than 500ing the page. */
async function safely<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[catalog] query failed, degrading to empty:", error);
    return fallback;
  }
}

type Row = Record<string, unknown>;

function parseRating(row: Row): { average: number; count: number } | undefined {
  return row.rating_average === null || row.rating_average === undefined
    ? undefined
    : { average: row.rating_average as number, count: (row.rating_count as number | null) ?? 0 };
}

function toSummary(row: Row): AppSummary {
  const packages = JSON.parse(row.packages_json as string) as SourcedPackage[];
  return {
    id: row.id as string,
    name: row.name as string,
    shortDescription: row.short_description as string,
    iconUrl: (row.icon_url as string | null) ?? undefined,
    kind: row.kind === "gui" ? "gui" : undefined,
    contentType: row.content_type === "game" ? "game" : undefined,
    category: row.category as string,
    rating: parseRating(row),
    ratingsBySource: summarizeRatingsBySource(packages),
    // Deduplicated — a merged app can carry two packages from the same
    // source now (e.g. AUR's official + -git build), and a summary card
    // only needs to say "AUR" once, not distinguish the channel — that's
    // what packageCount/channels are for instead.
    sources: [...new Set(packages.map((pkg) => pkg.source))],
    packageCount: packages.length,
    channels: summarizeChannels(packages),
  };
}

function str(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : (value as string);
}

function num(value: unknown): number | undefined {
  return value === null || value === undefined ? undefined : (value as number);
}

function bool(value: unknown): boolean | undefined {
  return value === null || value === undefined ? undefined : Boolean(value);
}

function json<T>(value: unknown): T | undefined {
  return value === null || value === undefined ? undefined : (JSON.parse(value as string) as T);
}

function toCatalogApp(row: Row): CatalogApp {
  return {
    id: row.id as string,
    name: row.name as string,
    shortDescription: row.short_description as string,
    longDescription: str(row.long_description),
    homepage: str(row.homepage),
    kind: row.kind === "gui" ? "gui" : undefined,
    contentType: row.content_type === "game" ? "game" : undefined,
    category: row.category as string,
    developer: str(row.developer),
    publisher: str(row.publisher),
    license: str(row.license),
    iconUrl: str(row.icon_url),
    approxSizeBytes: num(row.approx_size_bytes),
    changelog: str(row.changelog),
    requirements: str(row.requirements),
    rating: parseRating(row),
    aiFeatures: bool(row.ai_features),
    inAppPurchases: bool(row.in_app_purchases),
    gdprCompliant: bool(row.gdpr_compliant),
    ageRating:
      row.age_rating_system === null || row.age_rating_system === undefined
        ? undefined
        : { system: row.age_rating_system as string, value: row.age_rating_value as string },
    popularity: num(row.popularity),
    languages: json(row.languages_json),
    screenshots: json(row.screenshots_json),
    videos: json(row.videos_json),
    reviews: json(row.reviews_json),
    features: json(row.features_json),
    permissions: json(row.permissions_json),
    editorialTags: json(row.editorial_tags_json),
    suite: json(row.suite_json),
    compatibilityWarnings: json(row.compat_warnings_json),
    packages: json(row.packages_json) ?? [],
  };
}

const SUMMARY_COLUMNS =
  "id, name, short_description, icon_url, kind, content_type, category, rating_average, rating_count, packages_json";

/**
 * "cli" is best-effort, not positive-evidence like the rest of this file's
 * signals: `kind` only ever confirms "gui" (see `~/catalog-types`'s doc
 * comment), so "cli" here really means "not confirmed gui" — which still
 * includes plenty of real GUI apps the catalog just hasn't detected yet
 * (most of AUR/Arch, in particular — see the catalog repo's own
 * filter-effectiveness notes). Deliberately approximate anyway, per
 * explicit product direction: ship an imperfect split now, refine the
 * underlying signal later, rather than block the filter on it.
 */
export type InterfaceFilter = "all" | "gui" | "cli";

/**
 * "game" is real positive evidence (`contentType`, see `~/catalog-types`'s
 * doc comment) — "app" is just its complement (everything not confirmed a
 * game), same as `category` itself always being set now (see
 * `CatalogApp.category`'s doc comment on the catalog side): no more
 * "utility" — that used to be a client-side guess (a hardcoded category-
 * name list) layered on top of an already best-effort split, folded away
 * now that catalog's own taxonomy scopes categories by app/game directly
 * (Utilities is just one ordinary category among many, same as every
 * real app store researched treats it — see the categories board card).
 */
export type TypeFilter = "all" | "game" | "app";

export type SortOption = "relevance" | "name-asc" | "name-desc";

/**
 * One clause covering both text-search inclusion and ranking, shared by
 * `searchApps` and `browseApps` so they can't drift. Splits the query into
 * words and ORs them across name/short_description/id — a query no longer
 * has to appear as one literal contiguous phrase (real bug, found live:
 * searching "zen browser" for the real "Zen" browser app returned
 * nothing, since neither field contains that exact phrase). Ranks an
 * exact name match highest, then a name that starts with the query, then
 * per-word name/description hits — length-normalized (matched words as a
 * fraction of the name's own length), so a short, close match like "Zen"
 * outranks a long compound name that happens to contain the same words
 * (e.g. "zen-browser-bitwarden", a real Zen browser *extension* package —
 * matches both "zen" and "browser" too, but shouldn't outrank the browser
 * itself). Plain flat per-word points were tried first and verified live
 * to get this backwards — every "zen-browser-*" extension outscored "Zen"
 * itself on "zen browser" since they literally contain both query words
 * and "Zen"'s own description doesn't contain the substring "browser" at
 * all (only "browse"), just one "zen" hit.
 */
function buildSearchClause(trimmed: string): {
  where: string;
  whereArgs: string[];
  orderBy: string;
  orderArgs: string[];
} {
  if (!trimmed) return { where: "", whereArgs: [], orderBy: "name ASC", orderArgs: [] };

  const words = trimmed.split(/\s+/).filter(Boolean).slice(0, 8);
  const where = `(${words.map(() => "(id LIKE ? OR name LIKE ? OR short_description LIKE ?)").join(" OR ")})`;
  const whereArgs = words.flatMap((word) => [`%${word}%`, `%${word}%`, `%${word}%`]);

  const scoreParts = ["(CASE WHEN name = ? COLLATE NOCASE THEN 1000 ELSE 0 END)"];
  const orderArgs = [trimmed];
  scoreParts.push("(CASE WHEN name LIKE ? THEN 200 ELSE 0 END)");
  orderArgs.push(`${trimmed}%`);
  for (const word of words) {
    scoreParts.push("(CASE WHEN name LIKE ? THEN (300.0 / LENGTH(name)) ELSE 0 END)");
    orderArgs.push(`%${word}%`);
    scoreParts.push(
      "(CASE WHEN short_description LIKE ? THEN (50.0 / LENGTH(short_description)) ELSE 0 END)",
    );
    orderArgs.push(`%${word}%`);
  }
  return { where, whereArgs, orderBy: `(${scoreParts.join(" + ")}) DESC, name ASC`, orderArgs };
}

function sortClause(sort: SortOption, searchOrderBy: string): string {
  if (sort === "name-asc") return "name ASC";
  if (sort === "name-desc") return "name DESC";
  return searchOrderBy;
}

/**
 * Empty `query` returns a stable default listing (alphabetical) rather
 * than an arbitrary first-N — there's no "insertion order" worth
 * preserving once apps live in a table instead of a JSON array.
 */
export async function searchApps(query: string): Promise<AppSummary[]> {
  const db = getClient();
  if (!db) return [];

  return safely([], async () => {
    const trimmed = query.trim();
    const { where, whereArgs, orderBy, orderArgs } = buildSearchClause(trimmed);
    const result = await db.execute({
      sql: `SELECT ${SUMMARY_COLUMNS} FROM apps ${where ? `WHERE ${where}` : ""} ORDER BY ${orderBy} LIMIT ?`,
      args: [...whereArgs, ...orderArgs, MAX_RESULTS],
    });

    return result.rows.map((row) => toSummary(row as unknown as Row));
  });
}

/**
 * Paginated listing for the /browse page. A filtered request pays for one
 * `COUNT(*)` scan (a `WHERE`-scoped count can't be precomputed) — but the
 * common unfiltered case reuses `getStats()`'s precomputed total instead
 * of re-scanning the whole table on every page load.
 */
export interface BrowseOptions {
  interfaceFilter?: InterfaceFilter;
  typeFilter?: TypeFilter;
  category?: string;
  /** Restricts to apps with at least one package from this source — matched against the packages_json blob, the only place per-package sources live. */
  source?: PackageSourceId;
  sort?: SortOption;
}

export async function browseApps(
  query: string,
  page: number,
  options: BrowseOptions = {},
): Promise<BrowseResult> {
  const db = getClient();
  if (!db) return { apps: [], total: 0 };
  const {
    interfaceFilter = "all",
    typeFilter = "all",
    category,
    source,
    sort = "relevance",
  } = options;

  return safely({ apps: [], total: 0 }, async () => {
    const trimmed = query.trim();
    const { where: searchWhere, whereArgs, orderBy, orderArgs } = buildSearchClause(trimmed);

    const conditions: string[] = [];
    const conditionArgs: string[] = [];
    if (searchWhere) conditions.push(searchWhere);
    if (interfaceFilter === "gui") {
      conditions.push("kind = 'gui'");
    } else if (interfaceFilter === "cli") {
      conditions.push("(kind IS NULL OR kind != 'gui')");
    }
    if (typeFilter === "game") {
      conditions.push("content_type = 'game'");
    } else if (typeFilter === "app") {
      conditions.push("content_type IS NOT 'game'");
    }
    if (category) {
      conditions.push("category = ?");
      conditionArgs.push(category);
    }
    if (source) {
      conditions.push("packages_json LIKE ?");
      conditionArgs.push(`%"source":"${source}"%`);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const fullConditionArgs = [...whereArgs, ...conditionArgs];

    const total =
      conditions.length > 0
        ? await db
            .execute({
              sql: `SELECT COUNT(*) as count FROM apps ${where}`,
              args: fullConditionArgs,
            })
            .then((result) => Number(result.rows[0]?.count ?? 0))
        : await getStats().then((stats) => stats.total);

    const offset = Math.max(0, page) * BROWSE_PAGE_SIZE;
    const listResult = await db.execute({
      sql: `SELECT ${SUMMARY_COLUMNS} FROM apps ${where} ORDER BY ${sortClause(sort, orderBy)} LIMIT ? OFFSET ?`,
      args: [
        ...fullConditionArgs,
        ...(sort === "relevance" ? orderArgs : []),
        BROWSE_PAGE_SIZE,
        offset,
      ],
    });

    return { apps: listResult.rows.map((row) => toSummary(row as unknown as Row)), total };
  });
}

/** Looks up several apps by id at once, in whatever order the DB returns them — callers that need a specific order (e.g. an editorial block referencing ids in a chosen sequence) should re-sort client-side. Missing ids are silently dropped rather than erroring, since editorial content referencing a since-removed app shouldn't break the whole page. */
export async function getAppsByIds(ids: string[]): Promise<AppSummary[]> {
  const db = getClient();
  if (!db || ids.length === 0) return [];

  return safely([], async () => {
    const placeholders = ids.map(() => "?").join(", ");
    const result = await db.execute({
      sql: `SELECT ${SUMMARY_COLUMNS} FROM apps WHERE id IN (${placeholders})`,
      args: ids,
    });
    return result.rows.map((row) => toSummary(row as unknown as Row));
  });
}

export async function getAppById(id: string): Promise<CatalogApp | null> {
  const db = getClient();
  if (!db) return null;

  return safely(null, async () => {
    const result = await db.execute({ sql: `SELECT * FROM apps WHERE id = ?`, args: [id] });
    const row = result.rows[0];
    return row ? toCatalogApp(row as unknown as Row) : null;
  });
}

const TRENDING_PAGE_SIZE = 60;

// icon_url only — real bug, found live once the homepage's Trending row
// split into per-type (games/apps/utils) rows: this used to also admit
// screenshot-only apps ("either is enough to not read as a placeholder"),
// but `AppCard` has no `screenshots` prop and never renders one — it only
// ever puts an `<img>` for `iconUrl`, so a screenshot-only app rendered as
// a bare placeholder-icon card regardless, the exact thing this filter
// was supposed to prevent. Scoped to homepage/trending surfaces only (not
// Browse or search, which stay exhaustive/findable) — a curated showcase
// reading as polished is worth the cut. Verified live: 1,386 of the
// 21,844 popularity-scored apps have a real icon (mostly AUR's own
// usage-frequency signal, a source with no icon data at all) — still
// comfortably enough for every trending bucket (216 games, 1,170 apps —
// re-verified after the Apps/Games taxonomy redesign dropped "utility" as
// a separate bucket) and every homepage category row.
const HAS_VISUAL_ASSET = "icon_url IS NOT NULL";

/**
 * Apps with a real cross-source popularity score, highest first — see
 * `tuxery/catalog`'s `CatalogApp.popularity` doc comment for how it's
 * computed. Apps with no score are excluded entirely rather than sorted
 * to the bottom — "no signal" isn't "unpopular". `typeFilter: "game"` is
 * real positive evidence; "app" is just its complement. Also requires an
 * icon or screenshot — see `HAS_VISUAL_ASSET`.
 */
export async function getTrendingApps(typeFilter: TypeFilter = "all"): Promise<AppSummary[]> {
  const db = getClient();
  if (!db) return [];

  return safely([], async () => {
    let where = "";
    if (typeFilter === "game") {
      where = "AND content_type = 'game'";
    } else if (typeFilter === "app") {
      where = "AND content_type IS NOT 'game'";
    }
    const result = await db.execute({
      sql: `SELECT ${SUMMARY_COLUMNS} FROM apps WHERE popularity IS NOT NULL AND ${HAS_VISUAL_ASSET} ${where} ORDER BY popularity DESC LIMIT ?`,
      args: [TRENDING_PAGE_SIZE],
    });
    return result.rows.map((row) => toSummary(row as unknown as Row));
  });
}

const CATEGORY_PREVIEW_SIZE = 12;

/**
 * A small preview of apps from one category — powers the homepage's
 * per-category rows (Productivity, Creativity, ...). Popularity-scored
 * apps surface first (only ~10% of the catalog has a score — see
 * `getTrendingApps`'s doc comment), alphabetical after that so every
 * category still shows something even with zero scored apps in it,
 * rather than an empty row. Also requires an icon or screenshot — see
 * `HAS_VISUAL_ASSET`.
 */
export async function getAppsByCategory(category: string, limit = CATEGORY_PREVIEW_SIZE) {
  const db = getClient();
  if (!db) return [];

  return safely<AppSummary[]>([], async () => {
    const result = await db.execute({
      sql: `SELECT ${SUMMARY_COLUMNS} FROM apps WHERE category = ? AND ${HAS_VISUAL_ASSET} ORDER BY popularity IS NULL, popularity DESC, name ASC LIMIT ?`,
      args: [category, limit],
    });
    return result.rows.map((row) => toSummary(row as unknown as Row));
  });
}

export interface CategoryCount {
  category: string;
  count: number;
}

/**
 * Every real category with at least one app, most populated first — powers
 * the /categories listing and the homepage's "Browse by category" grid.
 * `typeFilter` scopes to apps or games — catalog draws each from its own
 * taxonomy now (see `tuxery/catalog`'s `CatalogApp.category` doc comment),
 * so the two never mix; "To Classify" is a real category like any other
 * and shows up here too, usually the largest by far.
 */
export async function getCategories(typeFilter: TypeFilter = "all"): Promise<CategoryCount[]> {
  const db = getClient();
  if (!db) return [];

  return safely([], async () => {
    const where =
      typeFilter === "game"
        ? "WHERE content_type = 'game'"
        : typeFilter === "app"
          ? "WHERE content_type IS NOT 'game'"
          : "";
    const result = await db.execute({
      sql: `SELECT category, COUNT(*) as count FROM apps ${where} GROUP BY category ORDER BY count DESC`,
    });
    return result.rows.map((row) => ({
      category: row.category as string,
      count: Number(row.count),
    }));
  });
}

/** Reads precomputed totals from the `meta` table — never `COUNT(*)` on `apps` at request time. */
export async function getStats(): Promise<CatalogStats> {
  const db = getClient();
  if (!db) return EMPTY_STATS;

  return safely(EMPTY_STATS, async () => {
    const result = await db.execute(`SELECT key, value FROM meta`);
    const meta = Object.fromEntries(result.rows.map((row) => [row.key, row.value])) as Record<
      string,
      string
    >;
    return { total: Number(meta.totalApps ?? 0), generatedAt: meta.generatedAt ?? "" };
  });
}

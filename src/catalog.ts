import { createClient, type Client } from "@libsql/client";
import {
  BROWSE_PAGE_SIZE,
  EMPTY_STATS,
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
    category: (row.category as string | null) ?? undefined,
    rating: parseRating(row),
    // Deduplicated — a merged app can carry two packages from the same
    // source now (e.g. AUR's official + -git build), and a summary card
    // only needs to say "AUR" once, not distinguish the channel.
    sources: [...new Set(packages.map((pkg) => pkg.source))],
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
    category: str(row.category),
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
    packages: json(row.packages_json) ?? [],
  };
}

const SUMMARY_COLUMNS =
  "id, name, short_description, icon_url, kind, content_type, category, rating_average, rating_count, packages_json";

/**
 * "gui" is the only real option today — `kind` is positive-evidence-only
 * (see `~/catalog-types`'s doc comment), so there's no "cli" to filter by
 * yet, only "confirmed gui" vs. "everything" (which still includes
 * unconfirmed GUI apps alongside real CLI tools).
 */
export type InterfaceFilter = "all" | "gui";

/**
 * "game" is the only real option today — `contentType` is
 * positive-evidence-only (see `~/catalog-types`'s doc comment), so
 * there's no confirmed "app" (not-a-game) to filter by yet, only
 * "confirmed game" vs. "everything".
 */
export type TypeFilter = "all" | "game";

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
    const result = trimmed
      ? await db.execute({
          sql: `SELECT ${SUMMARY_COLUMNS} FROM apps WHERE name LIKE ? OR short_description LIKE ? LIMIT ?`,
          args: [`%${trimmed}%`, `%${trimmed}%`, MAX_RESULTS],
        })
      : await db.execute({
          sql: `SELECT ${SUMMARY_COLUMNS} FROM apps ORDER BY name LIMIT ?`,
          args: [MAX_RESULTS],
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
}

export async function browseApps(
  query: string,
  page: number,
  options: BrowseOptions = {},
): Promise<BrowseResult> {
  const db = getClient();
  if (!db) return { apps: [], total: 0 };
  const { interfaceFilter = "all", typeFilter = "all", category, source } = options;

  return safely({ apps: [], total: 0 }, async () => {
    const trimmed = query.trim();
    const conditions: string[] = [];
    const conditionArgs: string[] = [];
    if (trimmed) {
      conditions.push("(id LIKE ? OR name LIKE ? OR short_description LIKE ?)");
      conditionArgs.push(`%${trimmed}%`, `%${trimmed}%`, `%${trimmed}%`);
    }
    if (interfaceFilter === "gui") {
      conditions.push("kind = 'gui'");
    }
    if (typeFilter === "game") {
      conditions.push("content_type = 'game'");
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

    const total =
      conditions.length > 0
        ? await db
            .execute({ sql: `SELECT COUNT(*) as count FROM apps ${where}`, args: conditionArgs })
            .then((result) => Number(result.rows[0]?.count ?? 0))
        : await getStats().then((stats) => stats.total);

    const offset = Math.max(0, page) * BROWSE_PAGE_SIZE;
    const listResult = await db.execute({
      sql: `SELECT ${SUMMARY_COLUMNS} FROM apps ${where} ORDER BY name LIMIT ? OFFSET ?`,
      args: [...conditionArgs, BROWSE_PAGE_SIZE, offset],
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

/**
 * Apps with a real cross-source popularity score, highest first — see
 * `tuxery/catalog`'s `CatalogApp.popularity` doc comment for how it's
 * computed. Apps with no score are excluded entirely rather than sorted
 * to the bottom — "no signal" isn't "unpopular". `typeFilter: "game"`
 * scopes to confirmed games (for the Games page); there's no equivalent
 * "confirmed not a game" filter, so the Apps page reuses the unfiltered
 * list rather than pretending to exclude games it can't actually rule out.
 */
export async function getTrendingApps(typeFilter: TypeFilter = "all"): Promise<AppSummary[]> {
  const db = getClient();
  if (!db) return [];

  return safely([], async () => {
    const where = typeFilter === "game" ? "AND content_type = 'game'" : "";
    const result = await db.execute({
      sql: `SELECT ${SUMMARY_COLUMNS} FROM apps WHERE popularity IS NOT NULL ${where} ORDER BY popularity DESC LIMIT ?`,
      args: [TRENDING_PAGE_SIZE],
    });
    return result.rows.map((row) => toSummary(row as unknown as Row));
  });
}

export interface CategoryCount {
  category: string;
  count: number;
}

/** Every real category with at least one app, most populated first — powers the /categories listing. */
export async function getCategories(): Promise<CategoryCount[]> {
  const db = getClient();
  if (!db) return [];

  return safely([], async () => {
    const result = await db.execute(
      `SELECT category, COUNT(*) as count FROM apps WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC`,
    );
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

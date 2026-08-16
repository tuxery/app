import { createClient, type Client } from "@libsql/client";
import {
  BROWSE_PAGE_SIZE,
  EMPTY_STATS,
  type AppSummary,
  type BrowseResult,
  type CatalogApp,
  type CatalogStats,
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

type Row = Record<string, unknown>;

function toSummary(row: Row): AppSummary {
  const packages = JSON.parse(row.packages_json as string) as SourcedPackage[];
  return {
    id: row.id as string,
    name: row.name as string,
    shortDescription: row.short_description as string,
    iconUrl: (row.icon_url as string | null) ?? undefined,
    sources: packages.map((pkg) => pkg.source),
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
    category: str(row.category),
    developer: str(row.developer),
    publisher: str(row.publisher),
    license: str(row.license),
    iconUrl: str(row.icon_url),
    approxSizeBytes: num(row.approx_size_bytes),
    changelog: str(row.changelog),
    requirements: str(row.requirements),
    rating:
      row.rating_average === null || row.rating_average === undefined
        ? undefined
        : {
            average: row.rating_average as number,
            count: (row.rating_count as number | null) ?? 0,
          },
    aiFeatures: bool(row.ai_features),
    inAppPurchases: bool(row.in_app_purchases),
    gdprCompliant: bool(row.gdpr_compliant),
    ageRating:
      row.age_rating_system === null || row.age_rating_system === undefined
        ? undefined
        : { system: row.age_rating_system as string, value: row.age_rating_value as string },
    languages: json(row.languages_json),
    screenshots: json(row.screenshots_json),
    videos: json(row.videos_json),
    reviews: json(row.reviews_json),
    features: json(row.features_json),
    permissions: json(row.permissions_json),
    editorialTags: json(row.editorial_tags_json),
    packages: json(row.packages_json) ?? [],
  };
}

const SUMMARY_COLUMNS = "id, name, short_description, icon_url, packages_json";

/**
 * Empty `query` returns a stable default listing (alphabetical) rather
 * than an arbitrary first-N — there's no "insertion order" worth
 * preserving once apps live in a table instead of a JSON array.
 */
export async function searchApps(query: string): Promise<AppSummary[]> {
  const db = getClient();
  if (!db) return [];

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
}

/**
 * Paginated listing for the /browse page. A `WHERE`-scoped count can't be
 * precomputed, so a filtered request pays for one `COUNT(*)` scan — but the
 * unfiltered (no name query) case, which is the common one, reuses
 * `getStats()`'s precomputed total instead of re-scanning all ~227k rows on
 * every page load.
 */
export async function browseApps(query: string, page: number): Promise<BrowseResult> {
  const db = getClient();
  if (!db) return { apps: [], total: 0 };

  const trimmed = query.trim();
  const where = trimmed ? "WHERE id LIKE ? OR name LIKE ? OR short_description LIKE ?" : "";
  const whereArgs = trimmed ? [`%${trimmed}%`, `%${trimmed}%`, `%${trimmed}%`] : [];

  const total = trimmed
    ? await db
        .execute({ sql: `SELECT COUNT(*) as count FROM apps ${where}`, args: whereArgs })
        .then((result) => Number(result.rows[0]?.count ?? 0))
    : await getStats().then((stats) => stats.total);

  const offset = Math.max(0, page) * BROWSE_PAGE_SIZE;
  const listResult = await db.execute({
    sql: `SELECT ${SUMMARY_COLUMNS} FROM apps ${where} ORDER BY name LIMIT ? OFFSET ?`,
    args: [...whereArgs, BROWSE_PAGE_SIZE, offset],
  });

  return { apps: listResult.rows.map((row) => toSummary(row as unknown as Row)), total };
}

export async function getAppById(id: string): Promise<CatalogApp | null> {
  const db = getClient();
  if (!db) return null;

  const result = await db.execute({ sql: `SELECT * FROM apps WHERE id = ?`, args: [id] });
  const row = result.rows[0];
  return row ? toCatalogApp(row as unknown as Row) : null;
}

/** Reads precomputed totals from the `meta` table — never `COUNT(*)` on `apps` at request time. */
export async function getStats(): Promise<CatalogStats> {
  const db = getClient();
  if (!db) return EMPTY_STATS;

  const result = await db.execute(`SELECT key, value FROM meta`);
  const meta = Object.fromEntries(result.rows.map((row) => [row.key, row.value])) as Record<
    string,
    string
  >;
  return { total: Number(meta.totalApps ?? 0), generatedAt: meta.generatedAt ?? "" };
}

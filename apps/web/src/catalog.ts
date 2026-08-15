import { createClient } from "@libsql/client/web";

// Mirrors `tuxery/catalog`'s dataset shape — packages/sources/src/types.ts
// (`PackageSourceId`, `SourcedPackage`) and packages/curator/src/enrich/types.ts
// (`CatalogApp`) plus packages/store/src/turso-client.ts (the `apps` table
// columns). No cross-repo import exists (separate repos, not a monorepo), so
// this is kept in sync by hand — see those files for field-by-field notes on
// what's actually populated today vs. typed for later.

// One id per connector folder under catalog's packages/sources/src/.
export type PackageSourceId =
  | "flathub"
  | "snapcraft"
  | "appimage"
  | "aur"
  | "debian"
  | "ubuntu"
  | "fedora"
  | "arch";

export const SOURCE_LABELS: Record<PackageSourceId, string> = {
  flathub: "Flathub (Flatpak)",
  snapcraft: "Snap Store",
  appimage: "AppImage",
  aur: "AUR",
  debian: "Debian",
  ubuntu: "Ubuntu",
  fedora: "Fedora",
  arch: "Arch Linux",
};

export interface SourcedPackage {
  source: PackageSourceId;
  name: string;
  description: string;
  version: string;
  appId?: string;
  iconFilename?: string;
  channel?: string;
  homepage?: string;
}

export interface CatalogApp {
  id: string;
  name: string;
  shortDescription: string;
  homepage?: string;
  packages: SourcedPackage[];
  iconUrl?: string;
  longDescription?: string;
  category?: string;
  developer?: string;
  publisher?: string;
  license?: string;
  languages?: string[];
  approxSizeBytes?: number;
  screenshots?: string[];
  videos?: string[];
  rating?: { average: number; count: number };
  reviews?: Array<{ author: string; text: string; rating: number }>;
  features?: string[];
  changelog?: string;
  requirements?: string;
  permissions?: string[];
  ageRating?: { system: string; value: string };
  aiFeatures?: boolean;
  inAppPurchases?: boolean;
  gdprCompliant?: boolean;
  editorialTags?: string[];
}

/** The subset of `CatalogApp` a search result card needs — cheap to select and stream in bulk, unlike the full row. */
export interface AppSummary {
  id: string;
  name: string;
  shortDescription: string;
  iconUrl?: string;
  sources: PackageSourceId[];
}

export interface CatalogStats {
  total: number;
  generatedAt: string;
}

export const EMPTY_STATS: CatalogStats = { total: 0, generatedAt: "" };

/** Bindings read from `platform.env` — same shape in `wrangler.toml` `[vars]`/`.dev.vars` and prod's Pages secrets. */
export interface CatalogEnv {
  TURSO_DB_URL: string;
  TURSO_DB_AUTH_TOKEN?: string;
}

const MAX_RESULTS = 60;

/**
 * `env` is undefined when there's no Turso config at all (shouldn't happen
 * under the Cloudflare Pages adapter, but keeps every query function safe
 * to call without a platform check at every call site).
 */
function getClient(env: CatalogEnv | undefined) {
  if (!env?.TURSO_DB_URL) return null;
  return createClient({ url: env.TURSO_DB_URL, authToken: env.TURSO_DB_AUTH_TOKEN });
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
        : { average: row.rating_average as number, count: (row.rating_count as number | null) ?? 0 },
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
export async function searchApps(env: CatalogEnv | undefined, query: string): Promise<AppSummary[]> {
  const client = getClient(env);
  if (!client) return [];

  const trimmed = query.trim();
  const result = trimmed
    ? await client.execute({
        sql: `SELECT ${SUMMARY_COLUMNS} FROM apps WHERE name LIKE ? OR short_description LIKE ? LIMIT ?`,
        args: [`%${trimmed}%`, `%${trimmed}%`, MAX_RESULTS],
      })
    : await client.execute({
        sql: `SELECT ${SUMMARY_COLUMNS} FROM apps ORDER BY name LIMIT ?`,
        args: [MAX_RESULTS],
      });

  return result.rows.map((row) => toSummary(row as unknown as Row));
}

export async function getAppById(env: CatalogEnv | undefined, id: string): Promise<CatalogApp | null> {
  const client = getClient(env);
  if (!client) return null;

  const result = await client.execute({ sql: `SELECT * FROM apps WHERE id = ?`, args: [id] });
  const row = result.rows[0];
  return row ? toCatalogApp(row as unknown as Row) : null;
}

/** Reads precomputed totals from the `meta` table — never `COUNT(*)` on `apps` at request time. */
export async function getStats(env: CatalogEnv | undefined): Promise<CatalogStats> {
  const client = getClient(env);
  if (!client) return EMPTY_STATS;

  const result = await client.execute(`SELECT key, value FROM meta`);
  const meta = Object.fromEntries(result.rows.map((row) => [row.key, row.value])) as Record<string, string>;
  return { total: Number(meta.totalApps ?? 0), generatedAt: meta.generatedAt ?? "" };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

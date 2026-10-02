import type { Client, InStatement, ResultSet } from "@libsql/client";

// Reads of the browse keys `tuxery/catalog`'s `publish()` precomputes into
// `meta` (counts per filter combination, and each source's ids in `name
// ASC` order, chunked) — see the comment above `BROWSE_KEYS_META_KEY` in
// catalog's `turso-client.ts` for the generation scheme this depends on.
// Pure and DB-light on purpose, so the format strings and the stale-
// generation handling are unit-tested (browse-keys.spec.ts) without a
// database. Every string format here is mirrored by hand from that file —
// the two repos share no package, so both sides' tests pin the same
// literals.

export type InterfaceFilterValue = "all" | "gui" | "cli";
export type TypeFilterValue = "all" | "game" | "app";

/** Key of the one `meta` row naming the current generation of browse keys. Absent on a dataset published before this existed: callers fall back to live queries. */
export const BROWSE_KEYS_META_KEY = "browseKeys";

export interface BrowseKeys {
  generation: string;
  /** Ids per `sourceIds:` chunk row — stored by catalog, so no constant to mirror. */
  sourceIdsChunkSize: number;
}

/** Parses the `browseKeys` row's JSON, `undefined` when it's absent or malformed (→ live fallback, never a throw). */
export function parseBrowseKeys(value: unknown): BrowseKeys | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const parsed = JSON.parse(value) as Partial<BrowseKeys>;
    return typeof parsed.generation === "string" &&
      Number.isInteger(parsed.sourceIdsChunkSize) &&
      (parsed.sourceIdsChunkSize as number) > 0
      ? (parsed as BrowseKeys)
      : undefined;
  } catch {
    return undefined;
  }
}

/** `*` stands for an unset source/category. The category goes last because it's the only part that may itself contain ":". */
export function countKey(
  generation: string,
  interfaceFilter: InterfaceFilterValue,
  typeFilter: TypeFilterValue,
  source: string | undefined,
  category: string | undefined,
): string {
  return `count:${generation}:${interfaceFilter}:${typeFilter}:${source ?? "*"}:${category ?? "*"}`;
}

export function sourceIdsChunkKey(generation: string, source: string, index: number): string {
  return `sourceIds:${generation}:${source}:${index}`;
}

/**
 * Where a page sits in a source's ascending (`name ASC`) id list, as a
 * `[start, end)` range, and whether to reverse it. `name DESC` is the same
 * list read from the end, so page `offset` of `total` is the mirrored
 * range. An out-of-range page is an empty range.
 */
export function pageRange(
  offset: number,
  pageSize: number,
  total: number,
  descending: boolean,
): { start: number; end: number } {
  if (offset >= total) return { start: 0, end: 0 };
  return descending
    ? { start: Math.max(0, total - offset - pageSize), end: total - offset }
    : { start: offset, end: Math.min(offset + pageSize, total) };
}

/** Indexes of the chunk rows covering `[start, end)` (a page can straddle two). */
export function chunkIndexesFor(start: number, end: number, chunkSize: number): number[] {
  if (end <= start) return [];
  const first = Math.floor(start / chunkSize);
  const last = Math.floor((end - 1) / chunkSize);
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

/** The ids of `[start, end)` out of the chunks (keyed by chunk index) that cover it, ascending. */
export function sliceFromChunks(
  chunks: Map<number, string[]>,
  start: number,
  end: number,
  chunkSize: number,
): string[] {
  const ids: string[] = [];
  for (const index of chunkIndexesFor(start, end, chunkSize)) {
    const chunk = chunks.get(index) ?? [];
    const from = Math.max(start - index * chunkSize, 0);
    const to = Math.min(end - index * chunkSize, chunkSize);
    ids.push(...chunk.slice(from, to));
  }
  return ids;
}

type ReadClient = Pick<Client, "batch">;

export type PinnedRead =
  | { kind: "ok"; results: ResultSet[] }
  /** The dataset republished since `generation` was read: the keys named by the caller no longer exist, so an absent key would be misread as 0. `keys` is the new generation, `undefined` if browse keys are gone altogether. */
  | { kind: "stale"; keys: BrowseKeys | undefined };

/**
 * Runs `statements` in one read transaction together with the
 * `browseKeys` row, and only returns their results when that row, read in
 * the same snapshot, still names `generation`. Catalog deletes a
 * generation's rows after a republish, and a missing key reads as "0 apps"
 * — so reading keys built from a generation cached before the republish
 * could silently serve empty pages. The snapshot makes the check exact.
 */
export async function readPinned(
  db: ReadClient,
  generation: string,
  statements: InStatement[],
): Promise<PinnedRead> {
  const [keysResult, ...results] = await db.batch(
    [{ sql: `SELECT value FROM meta WHERE key = ?`, args: [BROWSE_KEYS_META_KEY] }, ...statements],
    "read",
  );
  const keys = parseBrowseKeys(keysResult?.rows[0]?.value);
  return keys?.generation === generation ? { kind: "ok", results } : { kind: "stale", keys };
}

/** The one scalar a `SELECT value FROM meta WHERE key = ?` returned, `undefined` when the key doesn't exist. */
export function metaValue(result: ResultSet | undefined): string | undefined {
  const value = result?.rows[0]?.value;
  return typeof value === "string" ? value : undefined;
}

// The `page` of a /browse URL, and the page index `browseApps` is asked
// for. Both come from the visitor (the query string, the infinite scroll's
// `server$` call), so neither is trusted to be a number at all.

/** Pages past this one are answered as the first: no listing is that long, and an `OFFSET` costs a read per skipped row. */
export const MAX_PAGE_INDEX = 4999;

/** A zero-based page index that is safe to turn into an `OFFSET`; anything else (NaN, a fraction, a negative, a string) is the first page. */
export function toPageIndex(value: unknown): number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_PAGE_INDEX
    ? value
    : 0;
}

/** The zero-based page index of a `?page=` value (1-based in the URL); the first page when absent or not a page number. */
export function parsePageParam(value: string | null): number {
  if (value === null || !/^\d{1,6}$/.test(value)) return 0;
  return toPageIndex(Number(value) - 1);
}

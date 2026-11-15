// Whether the catalog database answered for this request, decided once by
// the root layout's `onGet` (before any page loader runs) and shared
// through `sharedMap`, so loaders and the layout read the same verdict.
// See `~/catalog`'s `isCatalogAvailable` for how it's checked. Pure apart
// from the map, unit-tested in catalog-status.spec.ts.

export const CATALOG_UNAVAILABLE_KEY = "tuxery.catalogUnavailable";

export function isCatalogUnavailable(sharedMap: Map<string, unknown>): boolean {
  return sharedMap.get(CATALOG_UNAVAILABLE_KEY) === true;
}

// Pages whose content doesn't come from the catalog: during an outage they
// still answer 200 (with the banner), every other page 503 — so crawlers
// and monitors see an outage where content is actually missing, and not
// on the docs or the settings.
const PAGES_WITHOUT_CATALOG = ["/docs/", "/settings/", "/claim/", "/feedback/"];

// A catalog query that failed while the health check said the database
// answers: the page was rendered from a fallback (an empty list, a missing
// app), so it must not be kept by any cache or be read as "doesn't exist".
// Per isolate: a request running next to the failing one is treated the
// same, which only costs it one uncached answer.
let lastQueryFailureAt: number | undefined;

export function noteQueryFailure(now: number = Date.now()): void {
  lastQueryFailureAt = now;
}

/** Whether a catalog query failed at or after `since` (a `Date.now()` taken when the request came in). */
export function queryFailedSince(since: number): boolean {
  return lastQueryFailureAt !== undefined && lastQueryFailureAt >= since;
}

const REQUEST_STARTED_KEY = "tuxery.requestStartedAt";

/** Stamps when the request came in, for `queryFailedDuringRequest`. */
export function markRequestStart(sharedMap: Map<string, unknown>, now: number = Date.now()): void {
  sharedMap.set(REQUEST_STARTED_KEY, now);
}

/** Whether a catalog query failed since `markRequestStart`: what a loader got back may be a fallback. */
export function queryFailedDuringRequest(sharedMap: Map<string, unknown>): boolean {
  const startedAt = sharedMap.get(REQUEST_STARTED_KEY);
  return typeof startedAt === "number" && queryFailedSince(startedAt);
}

export function needsCatalog(pathname: string): boolean {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return !PAGES_WITHOUT_CATALOG.some((prefix) => path.startsWith(prefix));
}

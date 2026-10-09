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
const PAGES_WITHOUT_CATALOG = ["/docs/", "/settings/", "/claim/"];

export function needsCatalog(pathname: string): boolean {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return !PAGES_WITHOUT_CATALOG.some((prefix) => path.startsWith(prefix));
}

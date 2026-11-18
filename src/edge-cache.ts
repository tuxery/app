// The Worker's shared edge cache, in front of the Qwik router. The router's
// own Cloudflare adapter already `cache.put`s successful responses, but into
// one cache that outlives deploys and never keeps a 404; `entry.cloudflare-
// pages.tsx` replaces it with this one. Pure decisions live here so they are
// unit-tested; the wrapper only does the I/O.

/**
 * One cache per build. The pages are rendered HTML that names the build's
 * hashed chunks (`/build/q-*.js`), which a deploy replaces: a page cached
 * before a deploy and served after it would point at files that no longer
 * exist, and its buttons would die. The adapter's cache is shared by every
 * build, so its entries had to stay short (10 minutes); with a name per
 * build they can last an hour.
 */
export function cacheName(commit: string): string {
  return `tuxery:${commit}`;
}

/**
 * The query parameters each page reads, by path: the whole list of what can
 * change a response. Any other parameter is dropped before the router sees
 * the request (`normalizeRequestUrl`). A route that starts reading a new one
 * must list it here, or the Worker will never show it the value; a test
 * (edge-cache.spec.ts) reads the routes' sources and fails until it does.
 * Qwik's own `qaction`, `qfunc` and `qdata` travel on POST requests, which
 * are passed through as they are.
 */
export const PAGE_QUERY_PARAMS: Readonly<Record<string, readonly string[]>> = {
  "/api/category-listing/": ["category", "page", "sub"],
  "/browse/": [
    "age",
    "category",
    "interface",
    "license",
    "page",
    "q",
    "sort",
    "source",
    "sub",
    "type",
  ],
  "/claim/": ["app"],
  "/feedback/": ["from"],
  "/settings/": ["tab"],
};

/**
 * The last path segment of the request Qwik Router's client makes for one
 * route loader's data when navigating without a page load:
 * `<route path>/q-loader-<loader id>.<manifest hash>.json`, with the page's
 * query string. Mirrors the router's own `LOADER_REGEX`.
 */
const LOADER_FILE = /\/q-loader-[^/.]+\.[^/.]+\.json$/;

/**
 * Sent with a loader request when the loader belongs to a layout: the path
 * of the page being navigated to, which the router then runs the loader for
 * instead of the path in the URL. Part of what the response depends on.
 */
const LOADER_PAGE_HEADER = "X-Qwik-fullpath";

/** The name under which `LOADER_PAGE_HEADER`'s value joins the cache key: not a listed parameter, so no request can carry it there itself. */
const LOADER_PAGE_KEY = "x-qwik-fullpath";

function withTrailingSlash(path: string): string {
  return path.endsWith("/") ? path : `${path}/`;
}

/**
 * A GET request's URL reduced to what the app reads, and the key its
 * response is cached under.
 *
 * `url` keeps the path and, of the query string, only the parameters listed
 * for that page in `PAGE_QUERY_PARAMS` — one value each (the first, the one
 * `searchParams.get()` returns), sorted by name. So `?x=1`, `?x=2`, ... and
 * `?utm_source=...` are all the same page as the bare URL, served from the
 * cache instead of each costing a render and its database reads, and
 * `?type=game&q=zen` and `?q=zen&type=game` are one entry.
 *
 * The router must be given `url`, not the original: some pages print their
 * own URL (the app page's "report a problem" link carries it), so rendering
 * the original and storing the result under the normalized key would let
 * anyone plant a page containing their own query string under the clean
 * URL. Rendered from `url`, a response can only depend on what its key is
 * made of.
 *
 * A loader request (`LOADER_FILE`) is for the page that owns the loader:
 * the path without that last segment, or the one `LOADER_PAGE_HEADER` names.
 * It keeps the parameters of both, and since that header picks what the
 * router answers, `cacheKey` carries its value too.
 */
export function normalizeRequestUrl(request: Request): { url: string; cacheKey: string } {
  const url = new URL(request.url);
  const isLoader = LOADER_FILE.test(url.pathname);
  const loaderPage = isLoader ? request.headers.get(LOADER_PAGE_HEADER) : null;
  const pagePaths = isLoader
    ? [url.pathname.replace(LOADER_FILE, "/"), ...(loaderPage ? [loaderPage] : [])]
    : [url.pathname];
  const names = new Set(
    pagePaths.flatMap((path) => PAGE_QUERY_PARAMS[withTrailingSlash(path)] ?? []),
  );

  const kept = new URLSearchParams();
  for (const name of names) {
    const value = url.searchParams.get(name);
    if (value !== null) kept.set(name, value);
  }
  kept.sort();
  url.search = kept.toString();
  url.hash = "";
  const normalized = url.href;

  if (loaderPage !== null) kept.set(LOADER_PAGE_KEY, loaderPage);
  url.search = kept.toString();
  return { url: normalized, cacheKey: url.href };
}

/**
 * Whether a request may be answered from, and stored in, the shared cache:
 * a GET, not on `wrangler dev`/local hosts (where the cache API does nothing
 * useful), without credentials.
 *
 * A `Cookie` header doesn't disqualify it. No route reads a cookie or sets
 * one (settings live in the browser's own storage), and to make that hold
 * whatever a route does later, the request the router renders from has its
 * `Cookie` header removed (`entry.cloudflare-pages.tsx`), while a response
 * that sets one is never stored (`isSharedCacheable`). The cookies a browser
 * does send here are Cloudflare's own (bot checks) and other tools': with
 * them counted, those visitors never got a cached page.
 */
export function isCacheableRequest(request: Request): boolean {
  const url = new URL(request.url);
  return (
    request.method === "GET" &&
    url.hostname !== "localhost" &&
    url.hostname !== "127.0.0.1" &&
    url.port === "" &&
    !request.headers.has("Authorization")
  );
}

const PRIVATE_DIRECTIVES = new Set(["private", "no-store", "no-cache"]);

/**
 * Statuses the shared cache keeps: a page, a page that doesn't exist (as good
 * a thing to remember as one that does: bots ask for the same wrong URLs by
 * the tens of thousands), and a permanent redirect (an app's former id, sent
 * on to its current one).
 */
const SHARED_CACHEABLE_STATUSES = new Set([200, 301, 404]);

/**
 * Whether a response may be stored for everyone: one of
 * `SHARED_CACHEABLE_STATUSES` that says so itself with a `Cache-Control`
 * without `private`/`no-store`/`no-cache`, and sets no cookie. A 503
 * (catalog down) carries `no-store` and is never kept.
 */
export function isSharedCacheable(response: Response): boolean {
  if (!SHARED_CACHEABLE_STATUSES.has(response.status)) return false;
  const cacheControl = response.headers.get("Cache-Control");
  if (!cacheControl || response.headers.has("Set-Cookie")) return false;
  return !cacheControl
    .split(",")
    .some((directive) => PRIVATE_DIRECTIVES.has(directive.trim().split("=", 1)[0].toLowerCase()));
}

/** What a 404 the router didn't give a `Cache-Control` of its own (a missing file) is kept with. */
export const NOT_FOUND_CACHE_CONTROL = "public, max-age=60, s-maxage=3600";

/** The response with a `Cache-Control` if it is a 404 without one; otherwise the response itself. */
export function withNotFoundCacheControl(response: Response): Response {
  if (response.status !== 404 || response.headers.has("Cache-Control")) return response;
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", NOT_FOUND_CACHE_CONTROL);
  return new Response(response.body, { status: response.status, headers });
}

/** The response with `X-Tuxery-Cache: hit` or `miss` added, so a `curl -I` says which one a page was (a cache hit's headers are immutable, hence the copy). */
export function withCacheStatus(response: Response, status: "hit" | "miss"): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Tuxery-Cache", status);
  return new Response(response.body, { status: response.status, headers });
}

/**
 * The response marked `no-store`: for a page rendered while a catalog query
 * failed, whose content is a fallback (an empty list, a "not found") that
 * neither the shared cache nor the browser should keep.
 */
export function withNoStore(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}

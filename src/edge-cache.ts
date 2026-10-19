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
 * Whether a request may be answered from, and stored in, the shared cache:
 * the same rule as the router's own adapter. Anonymous GETs only (nothing
 * here reads cookies or credentials), and not on `wrangler dev`/local hosts,
 * where the cache API does nothing useful.
 */
export function isCacheableRequest(request: Request): boolean {
  const url = new URL(request.url);
  return (
    request.method === "GET" &&
    url.hostname !== "localhost" &&
    url.hostname !== "127.0.0.1" &&
    url.port === "" &&
    !request.headers.has("Cookie") &&
    !request.headers.has("Authorization")
  );
}

const PRIVATE_DIRECTIVES = new Set(["private", "no-store", "no-cache"]);

/**
 * Whether a response may be stored for everyone: a 200 or a 404 (a page that
 * doesn't exist is as good a thing to remember as one that does: bots ask for
 * the same wrong URLs by the tens of thousands) that says so itself with a
 * `Cache-Control` without `private`/`no-store`/`no-cache`, and sets no cookie.
 * A 503 (catalog down) carries `no-store` and is never kept.
 */
export function isSharedCacheable(response: Response): boolean {
  if (response.status !== 200 && response.status !== 404) return false;
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

// What crawlers should index, and under which URL. Bots were ~70 % of the
// Worker's CPU on 2026-10-19 (Workers Logs, 72 h): they followed every app
// page's "Claim this listing" link (/claim/?app=<id>, ~100k uncached URLs,
// 24 % of the CPU), the build-variant pages and both hosts. robots.txt
// (public/) keeps the polite ones away; these tags tell search engines
// which page each one is a copy of. Pure, so it is unit-tested.

/** The one host pages are indexed under; `www.` redirects there (see layout.tsx's `onRequest`). */
export const CANONICAL_ORIGIN = "https://tuxery.store";

/**
 * `/app/<id>/<build>/` (an edition or version of the app) is a view of
 * `/app/<id>/`, not a page of its own; everything else is its own path.
 * The query string never makes a different page for a search engine.
 */
export function canonicalPath(pathname: string): string {
  const match = /^\/app\/([^/]+)\/.+/.exec(pathname);
  return match ? `/app/${match[1]}/` : pathname;
}

export function canonicalUrl(pathname: string): string {
  return `${CANONICAL_ORIGIN}${canonicalPath(pathname)}`;
}

/** Pages not worth indexing: a form with nothing in it yet, per-visitor settings. `undefined` for every other page. */
export function robotsDirective(pathname: string): string | undefined {
  if (pathname.startsWith("/claim/") || pathname.startsWith("/settings"))
    return "noindex, nofollow";
  return undefined;
}

/**
 * Pull-request Previews (`pr-<n>.preview.tuxery.store`, or `*.workers.dev`)
 * serve copies of the site that must never be indexed. Cloudflare only adds
 * `X-Robots-Tag: noindex` on its own `workers.dev` hosts, not on a custom
 * domain, so layout.tsx's `onRequest` sends it for both.
 */
export function isPreviewHost(hostname: string): boolean {
  return hostname.endsWith(".preview.tuxery.store") || hostname.endsWith(".workers.dev");
}

import type { RequestEvent } from "@qwik.dev/router";
import { isCatalogUnavailable, queryFailedDuringRequest } from "~/catalog-status";
import { servesSitemap } from "~/seo";
import { SITEMAP_CACHE_CONTROL } from "~/sitemap";

// How the sitemap's routes (routes/sitemap.xml/, routes/sitemaps/[name]/)
// answer. Server-only: request-event plumbing around `~/sitemap`'s pure XML.

/** Answers a sitemap request with `xml`, kept a day at the edge. */
export function sendSitemap(event: RequestEvent, xml: string): void {
  event.cacheControl(SITEMAP_CACHE_CONTROL);
  event.headers.set("Content-Type", "application/xml; charset=utf-8");
  event.send(200, xml);
}

/** Answers that there is no such sitemap: none on this host yet (`servesSitemap`), or no part by that name. */
export function sendNoSitemap(event: RequestEvent): void {
  event.headers.set("Content-Type", "text/plain; charset=utf-8");
  event.send(404, "Not Found");
}

/**
 * Whether the request was already answered for lack of the catalog: the
 * layout found it down (it answers 503 uncached), or one of the sitemap's
 * own reads failed — the list would be a fallback, never to be cached.
 */
export function answeredWithoutCatalog(event: RequestEvent): boolean {
  if (!isCatalogUnavailable(event.sharedMap) && !queryFailedDuringRequest(event.sharedMap)) {
    return false;
  }
  event.cacheControl({ noStore: true });
  event.headers.set("Content-Type", "text/plain; charset=utf-8");
  event.send(503, "The catalog is temporarily unavailable.");
  return true;
}

/** Whether this host serves sitemaps at all; answers 404 when it doesn't. */
export function servesSitemapOrAnswer(event: RequestEvent): boolean {
  if (servesSitemap(event.url.hostname)) return true;
  sendNoSitemap(event);
  return false;
}

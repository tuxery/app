import type { RequestHandler } from "@qwik.dev/router";
import { getAppSitemapPart } from "~/catalog";
import { resolveServerEnv } from "~/server-env";
import { CANONICAL_ORIGIN } from "~/seo";
import { appPageUrl, PAGES_SITEMAP, sitePagePaths, urlSetXml } from "~/sitemap";
import {
  answeredWithoutCatalog,
  sendNoSitemap,
  sendSitemap,
  servesSitemapOrAnswer,
} from "~/sitemap-response";

// One sitemap of the index at /sitemap.xml: the site's own pages
// (`pages.xml`, no catalog needed), or one part of a category's app pages.
export const onGet: RequestHandler = async (event) => {
  if (!servesSitemapOrAnswer(event)) return;
  const name = event.params.name ?? "";
  if (name === PAGES_SITEMAP) {
    sendSitemap(event, urlSetXml(sitePagePaths().map((path) => `${CANONICAL_ORIGIN}${path}`)));
    return;
  }
  if (answeredWithoutCatalog(event)) return;
  const ids = await getAppSitemapPart(resolveServerEnv(event.platform), name);
  if (answeredWithoutCatalog(event)) return;
  if (ids === undefined) {
    // No database at all (a local server without catalog's `pnpm serve`).
    event.cacheControl({ noStore: true });
    event.send(503, "The catalog is not configured.");
    return;
  }
  if (ids === null) {
    sendNoSitemap(event);
    return;
  }
  sendSitemap(event, urlSetXml(ids.map(appPageUrl)));
};

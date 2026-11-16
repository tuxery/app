import type { RequestHandler } from "@qwik.dev/router";
import { getAppSitemapSource } from "~/catalog";
import { resolveServerEnv } from "~/server-env";
import { appSitemapParts, PAGES_SITEMAP, sitemapIndexXml, sitemapUrl } from "~/sitemap";
import { answeredWithoutCatalog, sendSitemap, servesSitemapOrAnswer } from "~/sitemap-response";

// The sitemap index (`~/sitemap`): the site's pages, then the app pages,
// a few sitemaps per category. robots.txt names it once the site is public.
export const onGet: RequestHandler = async (event) => {
  if (!servesSitemapOrAnswer(event) || answeredWithoutCatalog(event)) return;
  const source = await getAppSitemapSource(resolveServerEnv(event.platform));
  if (answeredWithoutCatalog(event)) return;
  sendSitemap(
    event,
    sitemapIndexXml([
      { url: sitemapUrl(PAGES_SITEMAP), lastModified: APP_COMMIT_DATE },
      ...appSitemapParts(source?.categories ?? []).map((part) => ({
        url: sitemapUrl(part.name),
        lastModified: source?.generatedAt,
      })),
    ]),
  );
};

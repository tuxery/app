// The sitemap: /sitemap.xml is an index of smaller sitemaps, one for the
// site's own pages and, for the ~100k app pages, a few per category, each
// listing at most `APPS_PER_SITEMAP` of them (the protocol's limit is
// 50,000 URLs or 50 MB; smaller parts keep each response cheap to build).
// The app ids come from the lists catalog precomputes per category
// (`categoryIds:` rows of `meta`, see `~/browse-keys`), which together hold
// every published app exactly once: a part costs ~20 rows read, the whole
// sitemap ~300, where listing `apps` itself would read one row per app.
// The routes serving it live in routes/sitemap.xml/ and routes/sitemaps/.
// Pure, unit-tested in sitemap.spec.ts.

import { influencerSlugs } from "~/data/influencer-pages";
import { STORE_PAGES } from "~/data/store-pages";
import { METHODS } from "~/data/source-methods";
import { DOCS_PAGES } from "~/docs-nav";
import { buildPath } from "~/product-builds";
import { CANONICAL_ORIGIN } from "~/seo";

/** App URLs per sitemap part. */
export const APPS_PER_SITEMAP = 10_000;

/** A day at the edge: the sitemap only changes when catalog republishes or the site deploys (which starts a new edge cache). */
export const SITEMAP_CACHE_CONTROL = {
  public: true,
  maxAge: 3600,
  sMaxAge: 86_400,
  staleWhileRevalidate: 86_400,
} as const;

/** The file name of the sitemap listing the site's own pages. */
export const PAGES_SITEMAP = "pages.xml";

/** A sitemap's URL, from its file name. */
export function sitemapUrl(name: string): string {
  return `${CANONICAL_ORIGIN}/sitemaps/${name}`;
}

/**
 * A category's name in a sitemap's file name: lowercase, "&" spelled out,
 * anything else that isn't a letter or a digit a single hyphen
 * ("Books & Reference" → "books-and-reference").
 */
export function categorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface CategorySize {
  category: string;
  count: number;
}

export interface AppSitemapPart {
  /** File name, `apps-<category slug>-<part number from 1>.xml`. */
  name: string;
  category: string;
  /** The part's `[start, end)` range in the category's id list. */
  start: number;
  end: number;
}

/** Every app sitemap part, `APPS_PER_SITEMAP` ids each, in the order of `categories`. */
export function appSitemapParts(
  categories: readonly CategorySize[],
  perSitemap: number = APPS_PER_SITEMAP,
): AppSitemapPart[] {
  return categories.flatMap(({ category, count }) =>
    Array.from({ length: Math.ceil(count / perSitemap) }, (_, i) => ({
      name: `apps-${categorySlug(category)}-${i + 1}.xml`,
      category,
      start: i * perSitemap,
      end: Math.min((i + 1) * perSitemap, count),
    })),
  );
}

/** The part a file name names, `undefined` for any other name. */
export function findAppSitemapPart(
  name: string,
  categories: readonly CategorySize[],
  perSitemap: number = APPS_PER_SITEMAP,
): AppSitemapPart | undefined {
  return appSitemapParts(categories, perSitemap).find((part) => part.name === name);
}

/** Creator pages that are a demo of the format, not anyone's picks. */
const DEMO_CREATOR_PAGES = new Set(["example"]);

/**
 * The site's own pages worth indexing, as paths: the home page, the stores'
 * front doors, the categories' index, every docs page, every source's and
 * store's page, and the creators' pages. Not listed: /browse/ (search and
 * filter results; robots.txt keeps its query strings out), /claim/,
 * /settings/ and /feedback/ (forms), and the app pages, which have their
 * own sitemaps.
 */
export function sitePagePaths(): string[] {
  const creators = influencerSlugs().filter((slug) => !DEMO_CREATOR_PAGES.has(slug));
  return [
    "/",
    "/apps/",
    "/games/",
    "/categories/",
    ...STORE_PAGES.map((store) => `/sources/${store.id}/`),
    "/creators/",
    ...creators.map((slug) => `/creators/${slug}/`),
    ...DOCS_PAGES.map((page) => page.href),
    ...Object.keys(METHODS).map((id) => `/docs/sources/${id}/`),
  ];
}

/** An app's page, as the sitemap lists it: the product page, which every build-variant page names as canonical. */
export function appPageUrl(id: string): string {
  return `${CANONICAL_ORIGIN}${buildPath(id, {})}`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** A W3C datetime for `<lastmod>`, `undefined` for anything that isn't a date. */
function lastmod(date: string | undefined): string | undefined {
  if (!date) return undefined;
  const time = Date.parse(date);
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

const XML_DECLARATION = `<?xml version="1.0" encoding="UTF-8"?>\n`;
const NAMESPACE = `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`;

/**
 * A sitemap index. `lastModified` is when its sitemap's content last
 * changed (catalog's publish for the app parts, the deploy for the pages),
 * left out when unknown.
 */
export function sitemapIndexXml(
  sitemaps: readonly { url: string; lastModified?: string }[],
): string {
  const entries = sitemaps.map(({ url, lastModified }) => {
    const date = lastmod(lastModified);
    return `<sitemap><loc>${escapeXml(url)}</loc>${date ? `<lastmod>${date}</lastmod>` : ""}</sitemap>`;
  });
  return `${XML_DECLARATION}<sitemapindex ${NAMESPACE}>\n${entries.join("\n")}\n</sitemapindex>\n`;
}

/**
 * A sitemap of `urls`. No per-URL `<lastmod>`: the catalog knows when an
 * app last had a release for only a few percent of them, and a date that
 * isn't the page's last real change makes search engines ignore the field
 * for the whole site.
 */
export function urlSetXml(urls: readonly string[]): string {
  const entries = urls.map((url) => `<url><loc>${escapeXml(url)}</loc></url>`);
  return `${XML_DECLARATION}<urlset ${NAMESPACE}>\n${entries.join("\n")}\n</urlset>\n`;
}

// What crawlers should index, under which URL, and what a shared link
// shows. Bots were ~70 % of the Worker's CPU on 2026-10-19 (Workers Logs,
// 72 h): they followed every app page's "Claim this listing" link
// (/claim/?app=<id>, ~100k uncached URLs, 24 % of the CPU), the
// build-variant pages and both hosts. robots.txt (`~/static-files`) keeps
// the polite ones away; these tags tell search engines which page each one
// is a copy of. Pure, so it is unit-tested.

/** The one host pages are indexed under; `www.` redirects there (see layout.tsx's `onRequest`). */
export const CANONICAL_ORIGIN = "https://tuxery.store";

/**
 * The public switch, the only one: `true` lets search engines index the
 * site. Private beta until then: the link is shared with a few testers, and
 * sources we wrote to were asked to keep it to themselves, so no page may
 * be indexed yet.
 *
 * Everything that differs between the beta and the public site reads it:
 * - the `X-Robots-Tag: noindex` header on pages (`robotsHeader`, set by
 *   layout.tsx's `onRequest`) and their `<meta name="robots">` (`robotsMeta`);
 * - the same header on static files, in the `_headers` file the build
 *   writes (`~/static-files`);
 * - robots.txt's `Sitemap:` line, also written by the build;
 * - whether production serves /sitemap.xml at all (`servesSitemap`).
 *
 * robots.txt keeps allowing crawlers either way, on purpose: a crawler kept
 * out by robots.txt never reads the `noindex`, and could still list a URL
 * it found linked elsewhere.
 */
export const SITE_IS_PUBLIC = false;

export const SITE_NAME = "Tuxery";

/** What a shared link to a page without its own description says (the web manifest's description). */
export const DEFAULT_DESCRIPTION =
  "Search-first Linux app and game discovery — never installs anything itself, every button leads straight to the real source.";

/** The image a shared link shows when its page has none of its own: public/og-image.jpg, at the size Open Graph and X recommend. */
export const DEFAULT_SOCIAL_IMAGE = {
  path: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Tuxery, the unified Linux app store",
} as const;

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

/** Whether pages served on `hostname` may be indexed: never a Preview, the site only once it is public. */
export function isIndexableHost(hostname: string, isPublic: boolean = SITE_IS_PUBLIC): boolean {
  return isPublic && !isPreviewHost(hostname);
}

/** The `X-Robots-Tag` every response of `hostname` carries, if any. */
export function robotsHeader(
  hostname: string,
  isPublic: boolean = SITE_IS_PUBLIC,
): string | undefined {
  return isIndexableHost(hostname, isPublic) ? undefined : "noindex";
}

/** Pages not worth indexing: a form with nothing in it yet, per-visitor settings. `undefined` for every other page. */
export function robotsDirective(pathname: string): string | undefined {
  if (pathname.startsWith("/claim/") || pathname.startsWith("/settings"))
    return "noindex, nofollow";
  return undefined;
}

/**
 * A page's `<meta name="robots">`: its own directive (`robotsDirective`),
 * else the host's (`robotsHeader`), so the page source says what the
 * response header says. `undefined` once the page may be indexed.
 */
export function robotsMeta(
  pathname: string,
  hostname: string,
  isPublic: boolean = SITE_IS_PUBLIC,
): string | undefined {
  return robotsDirective(pathname) ?? robotsHeader(hostname, isPublic);
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

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * Whether /sitemap.xml and its parts answer on `hostname`. Production only
 * serves them once the site is public: until then they would hand every
 * crawler that probes /sitemap.xml a list of ~100k pages to render, none of
 * which it may index. Previews and local servers always serve them, so they
 * can be checked before the launch.
 */
export function servesSitemap(hostname: string, isPublic: boolean = SITE_IS_PUBLIC): boolean {
  return isPublic || isPreviewHost(hostname) || isLocalHost(hostname);
}

/** A `<meta>` tag of the document head: `name` for the standard and X ones, `property` for Open Graph's. */
export interface HeadMeta {
  name?: string;
  property?: string;
  content?: string;
}

const RASTER_IMAGE = /\.(?:png|jpe?g|gif|webp)$/i;

/**
 * The page's own image for link previews, from an app icon: only a raster
 * one (Open Graph and X don't take SVG), and only an http(s) URL.
 */
export function socialImageFor(iconUrl: string | undefined): string | undefined {
  if (!iconUrl) return undefined;
  try {
    const url = new URL(iconUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    return RASTER_IMAGE.test(url.pathname) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** The tags a page sets itself to show its own image: the image, and X's small square card, which suits an icon. */
export function pageImageMeta(imageUrl: string | undefined): HeadMeta[] {
  return imageUrl
    ? [
        { property: "og:image", content: imageUrl },
        { name: "twitter:card", content: "summary" },
      ]
    : [];
}

const TITLE_SUFFIX = ` — ${SITE_NAME}`;

/**
 * The Open Graph and X (Twitter) card tags of a page, from what its `head`
 * already says: its title (without the " — Tuxery" every title ends with,
 * since `og:site_name` says it), its description, and its own image if it
 * set one (`pageImageMeta`); the site's description and image otherwise.
 * A tag the page set itself is left to it, never repeated. X reads
 * `og:title`, `og:description` and `og:image` when it has no `twitter:`
 * tag of its own, so `twitter:card` is the only one needed.
 */
export function socialMeta(input: {
  title: string;
  url: string;
  metas: readonly HeadMeta[];
}): HeadMeta[] {
  const own = (key: "name" | "property", value: string) =>
    input.metas.find((meta) => meta[key] === value)?.content;
  const title = input.title.endsWith(TITLE_SUFFIX)
    ? input.title.slice(0, -TITLE_SUFFIX.length)
    : input.title;

  const tags: HeadMeta[] = [
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:type", content: "website" },
    { property: "og:url", content: input.url },
    { property: "og:title", content: title || SITE_NAME },
    { property: "og:description", content: own("name", "description") ?? DEFAULT_DESCRIPTION },
  ];
  if (!own("property", "og:image")) {
    tags.push(
      { property: "og:image", content: `${CANONICAL_ORIGIN}${DEFAULT_SOCIAL_IMAGE.path}` },
      { property: "og:image:width", content: String(DEFAULT_SOCIAL_IMAGE.width) },
      { property: "og:image:height", content: String(DEFAULT_SOCIAL_IMAGE.height) },
      { property: "og:image:alt", content: DEFAULT_SOCIAL_IMAGE.alt },
      { name: "twitter:card", content: "summary_large_image" },
    );
  }
  const isOwn = (tag: HeadMeta) =>
    input.metas.some((meta) =>
      tag.property ? meta.property === tag.property : meta.name === tag.name,
    );
  return tags.filter((tag) => !isOwn(tag));
}

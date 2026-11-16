// robots.txt and Cloudflare's `_headers`, written into dist/ by the build
// (vite.config.ts's `staticFiles` plugin) rather than kept in public/, so
// that the public switch (`SITE_IS_PUBLIC`) and the security headers each
// live in one place. Both are static files: Cloudflare serves them, and
// applies `_headers` to every static file, without running the Worker.
// Pure (relative imports only, so vite.config.ts can load it), unit-tested
// in static-files.spec.ts.

import { SECURITY_HEADERS } from "./security-headers.ts";
import { CANONICAL_ORIGIN, SITE_IS_PUBLIC } from "./seo.ts";

/**
 * Every page is rendered on demand, so crawlers are asked to crawl only
 * what is worth indexing. Not useful to crawl (and expensive to render,
 * 2026-10-19):
 * - /claim/?app=<id>: one per app (~100k), a form that isn't live yet;
 * - /browse with filters or a search: endless combinations of listings
 *   reachable from /apps/, /games/ and /categories/;
 * - /app/<id>/<build>/: an edition or version of /app/<id>/;
 * - /settings: per-visitor preferences.
 * The sitemap is only named once the site is public (`servesSitemap`).
 */
export function robotsTxt(isPublic: boolean = SITE_IS_PUBLIC): string {
  const lines = [
    "# Written by the build (src/static-files.ts): edit that file, not this one.",
    "User-agent: *",
    "Disallow: /claim/",
    "Disallow: /browse?",
    "Disallow: /browse/?",
    "Disallow: /app/*/*/",
    "Disallow: /settings",
    "Allow: /",
  ];
  if (isPublic) lines.push("", `Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`);
  return `${lines.join("\n")}\n`;
}

type HeaderList = readonly (readonly [name: string, value: string])[];

/** One `_headers` rule: a path pattern, then its headers, indented. */
function headersBlock(path: string, headers: HeaderList): string {
  return [path, ...headers.map(([name, value]) => `  ${name}: ${value}`)].join("\n");
}

/**
 * Cloudflare's `_headers` for static files
 * (https://developers.cloudflare.com/workers/static-assets/headers/).
 * The `/*` block gives them the security headers the Worker puts on
 * everything else (`~/security-headers`), and `X-Robots-Tag: noindex`
 * until the site is public, as layout.tsx's `onRequest` does for pages.
 */
export function headersFile(isPublic: boolean = SITE_IS_PUBLIC): string {
  const everyFile: HeaderList = [
    ...(isPublic ? [] : [["X-Robots-Tag", "noindex"] as const]),
    ...SECURITY_HEADERS,
  ];
  return `${[
    "# Written by the build (src/static-files.ts): edit that file, not this one.",
    headersBlock("/*", everyFile),
    headersBlock("/*service-worker.js", [
      ["Cache-Control", "no-store"],
      ["Content-Type", "application/javascript"],
      ["X-Content-Type-Options", "nosniff"],
    ]),
    headersBlock("/build/*", [
      ["Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable"],
    ]),
    headersBlock("/assets/*", [
      ["Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable"],
    ]),
    `# The logo sprite keeps its name when logos are added, so it can't be immutable.\n${headersBlock(
      "/logos.svg",
      [["Cache-Control", "public, max-age=3600"]],
    )}`,
  ].join("\n\n")}\n`;
}

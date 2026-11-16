import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "./security-headers";
import { headersFile, robotsTxt } from "./static-files";

/** The `/*` rule of a `_headers` file: its header lines, up to the next blank line. */
function everyFileRule(file: string): string {
  const start = file.indexOf("\n/*\n");
  return file.slice(start, file.indexOf("\n\n", start + 1));
}

describe("headersFile", () => {
  it("gives every static file the security headers", () => {
    for (const isPublic of [false, true]) {
      const rule = everyFileRule(headersFile(isPublic));
      for (const [name, value] of SECURITY_HEADERS) expect(rule).toContain(`\n  ${name}: ${value}`);
    }
  });

  it("keeps static files out of search engines until the site is public", () => {
    expect(everyFileRule(headersFile(false))).toContain("\n  X-Robots-Tag: noindex");
    expect(headersFile(true)).not.toContain("X-Robots-Tag");
  });

  it("keeps the cache rules", () => {
    const file = headersFile();
    expect(file).toContain(
      "/build/*\n  Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable",
    );
    expect(file).toContain("/logos.svg\n  Cache-Control: public, max-age=3600");
    expect(file).toContain("/*service-worker.js\n  Cache-Control: no-store");
  });
});

describe("robotsTxt", () => {
  it("keeps crawlers off the pages not worth rendering, and lets them read the rest", () => {
    const file = robotsTxt();
    for (const rule of [
      "Disallow: /claim/",
      "Disallow: /browse?",
      "Disallow: /browse/?",
      "Disallow: /app/*/*/",
      "Disallow: /settings",
      "Allow: /",
    ]) {
      expect(file.split("\n")).toContain(rule);
    }
  });

  it("names the sitemap once the site is public, not before", () => {
    expect(robotsTxt(false)).not.toContain("Sitemap:");
    expect(robotsTxt(true)).toContain("\nSitemap: https://tuxery.store/sitemap.xml\n");
  });
});

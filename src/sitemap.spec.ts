import { describe, expect, it } from "vitest";
import { DOCS_PAGES } from "./docs-nav";
import {
  appPageUrl,
  appSitemapParts,
  findAppSitemapPart,
  sitemapIndexXml,
  sitemapUrl,
  sitePagePaths,
  urlSetXml,
  categoryPagePaths,
} from "./sitemap";
import { categorySlug } from "./categories";

describe("categorySlug", () => {
  it("makes a file-name-safe slug of a category", () => {
    expect(categorySlug("Developer Tools")).toBe("developer-tools");
    expect(categorySlug("Books & Reference")).toBe("books-and-reference");
    expect(categorySlug("Role-Playing")).toBe("role-playing");
    expect(categorySlug("To Classify")).toBe("to-classify");
  });
});

describe("appSitemapParts", () => {
  const categories = [
    { category: "Developer Tools", count: 25 },
    { category: "Puzzle", count: 10 },
    { category: "Empty", count: 0 },
  ];

  it("cuts each category into parts of at most the given size", () => {
    expect(appSitemapParts(categories, 10)).toEqual([
      { name: "apps-developer-tools-1.xml", category: "Developer Tools", start: 0, end: 10 },
      { name: "apps-developer-tools-2.xml", category: "Developer Tools", start: 10, end: 20 },
      { name: "apps-developer-tools-3.xml", category: "Developer Tools", start: 20, end: 25 },
      { name: "apps-puzzle-1.xml", category: "Puzzle", start: 0, end: 10 },
    ]);
  });

  it("covers every app exactly once", () => {
    const parts = appSitemapParts(categories, 10);
    const total = parts.reduce((sum, part) => sum + part.end - part.start, 0);
    expect(total).toBe(35);
  });

  it("finds a part by its file name only", () => {
    expect(findAppSitemapPart("apps-developer-tools-2.xml", categories, 10)).toMatchObject({
      category: "Developer Tools",
      start: 10,
      end: 20,
    });
    expect(findAppSitemapPart("apps-developer-tools-4.xml", categories, 10)).toBeUndefined();
    expect(findAppSitemapPart("apps-empty-1.xml", categories, 10)).toBeUndefined();
    expect(findAppSitemapPart("pages.xml", categories, 10)).toBeUndefined();
  });
});

describe("sitePagePaths", () => {
  const paths = sitePagePaths();

  it("lists the site's main doors and every docs page", () => {
    for (const path of ["/", "/apps/", "/games/", "/categories/", "/creators/"]) {
      expect(paths).toContain(path);
    }
    for (const page of DOCS_PAGES) expect(paths).toContain(page.href);
    expect(paths).toContain("/sources/flatpak-flathub/");
    expect(paths).toContain("/docs/sources/flatpak-flathub/");
    expect(paths).toContain("/creators/baxyz/");
  });

  it("leaves out forms, searches, the demo creator page and duplicates", () => {
    expect(paths).not.toContain("/creators/example/");
    expect(paths.some((path) => /^\/(claim|settings|feedback|browse)/.test(path))).toBe(false);
    expect(new Set(paths).size).toBe(paths.length);
    for (const path of paths) expect(path.endsWith("/")).toBe(true);
  });
});

describe("appPageUrl", () => {
  it("is the product page's canonical URL, the id encoded as the site's links encode it", () => {
    expect(appPageUrl("firefox")).toBe("https://tuxery.store/app/firefox/");
    expect(appPageUrl("deb-debian:calligraplan")).toBe(
      "https://tuxery.store/app/deb-debian%3Acalligraplan/",
    );
    expect(appPageUrl("appimage-manual:pCloud Drive")).toBe(
      "https://tuxery.store/app/appimage-manual%3ApCloud%20Drive/",
    );
  });
});

describe("sitemapIndexXml", () => {
  it("lists each sitemap, with a lastmod only when the date is real", () => {
    const xml = sitemapIndexXml([
      { url: sitemapUrl("pages.xml"), lastModified: "2026-11-16T20:55:53Z" },
      { url: sitemapUrl("apps-puzzle-1.xml"), lastModified: "" },
      { url: sitemapUrl("apps-arcade-1.xml"), lastModified: "not a date" },
    ]);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<sitemapindex xmlns=/);
    expect(xml).toContain(
      "<sitemap><loc>https://tuxery.store/sitemaps/pages.xml</loc><lastmod>2026-11-16T20:55:53.000Z</lastmod></sitemap>",
    );
    expect(xml).toContain(
      "<sitemap><loc>https://tuxery.store/sitemaps/apps-puzzle-1.xml</loc></sitemap>",
    );
    expect(xml).toContain(
      "<sitemap><loc>https://tuxery.store/sitemaps/apps-arcade-1.xml</loc></sitemap>",
    );
  });
});

describe("urlSetXml", () => {
  it("lists each URL, escaped for XML", () => {
    const xml = urlSetXml(["https://tuxery.store/", "https://tuxery.store/a?b=1&c=<2>"]);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("<url><loc>https://tuxery.store/</loc></url>");
    expect(xml).toContain("<url><loc>https://tuxery.store/a?b=1&amp;c=&lt;2&gt;</loc></url>");
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });
});

describe("categoryPagePaths", () => {
  it("lists each listed category's page, then its subcategories'", () => {
    expect(
      categoryPagePaths(
        [{ category: "Puzzle" }, { category: "To Classify" }, { category: "Settings" }],
        [
          { category: "Puzzle", subcategory: "Word & Trivia" },
          { category: "Strategy", subcategory: "Real-Time Strategy" },
        ],
      ),
    ).toEqual(["/categories/puzzle/", "/categories/puzzle/word-and-trivia/"]);
  });
});

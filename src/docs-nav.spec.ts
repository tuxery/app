import { describe, expect, it } from "vitest";
import {
  adjacentDocsPages,
  DOCS_PAGES,
  docsEditUrl,
  findDocsPage,
  MOVED_TO_DOCS,
} from "~/docs-nav";

describe("docs nav", () => {
  it("lists every page once, each under /docs/ with a trailing slash", () => {
    const hrefs = DOCS_PAGES.map((page) => page.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) expect(href).toMatch(/^\/docs\/([a-z-]+\/)?$/);
  });

  it("finds a page with or without its trailing slash", () => {
    expect(findDocsPage("/docs/faq")?.title).toBe("FAQ");
    expect(findDocsPage("/docs/faq/")?.title).toBe("FAQ");
    expect(findDocsPage("/docs/nope/")).toBeUndefined();
  });

  it("links prev/next across section boundaries, none past either end", () => {
    expect(adjacentDocsPages("/docs/").prev).toBeUndefined();
    expect(adjacentDocsPages("/docs/").next?.href).toBe("/docs/status/");
    const lastFaqNext = adjacentDocsPages("/docs/faq/").next;
    expect(lastFaqNext?.href).toBe("/docs/formats/");
    expect(adjacentDocsPages(DOCS_PAGES.at(-1)?.href ?? "").next).toBeUndefined();
    expect(adjacentDocsPages("/elsewhere/")).toEqual({});
  });

  it("only offers an edit link for Markdown pages", () => {
    expect(docsEditUrl(findDocsPage("/docs/glossary/"))).toBe(
      "https://github.com/tuxery/app/edit/main/src/routes/docs/glossary/index.mdx",
    );
    expect(docsEditUrl(findDocsPage("/docs/status/"))).toBeUndefined();
  });

  it("redirects every moved URL to a real docs page", () => {
    for (const target of Object.values(MOVED_TO_DOCS)) {
      expect(findDocsPage(target)?.href).toBe(target);
    }
  });
});

// The docs section's table of contents — one list drives the sidebar, the
// prev/next links, the "edit this page" link and the footer's columns, so
// adding a page is one entry here plus its route folder under
// `routes/docs/`. Pure on purpose, unit-tested in docs-nav.spec.ts.

export interface DocsPage {
  /** Canonical URL, always with a trailing slash. */
  href: string;
  /** Sidebar/footer label. */
  title: string;
  /** Source file relative to the repo root, when it's Markdown — only those get an "edit this page" link. */
  markdown?: string;
}

export interface DocsSection {
  title: string;
  pages: DocsPage[];
}

const mdx = (slug: string) => `src/routes/docs/${slug}/index.mdx`;

export const DOCS_SECTIONS: DocsSection[] = [
  {
    title: "About Tuxery",
    pages: [
      { href: "/docs/", title: "About" },
      { href: "/docs/status/", title: "Status" },
      { href: "/docs/roadmap/", title: "Roadmap", markdown: mdx("roadmap") },
      { href: "/docs/changelog/", title: "Changelog" },
      { href: "/docs/faq/", title: "FAQ", markdown: mdx("faq") },
    ],
  },
  {
    title: "Guides",
    pages: [
      { href: "/docs/formats/", title: "Which format to choose", markdown: mdx("formats") },
      { href: "/docs/rankings/", title: "How rankings work", markdown: mdx("rankings") },
      { href: "/docs/glossary/", title: "Glossary", markdown: mdx("glossary") },
    ],
  },
  {
    title: "Data",
    pages: [
      { href: "/docs/philosophy/", title: "Data philosophy", markdown: mdx("philosophy") },
      { href: "/docs/merging/", title: "How sources are merged", markdown: mdx("merging") },
      { href: "/docs/sources/", title: "Sources" },
      { href: "/docs/coverage/", title: "Per-source to-do" },
      { href: "/docs/open-data/", title: "Open data", markdown: mdx("open-data") },
    ],
  },
  {
    title: "Contribute",
    pages: [{ href: "/docs/contribute/", title: "How to contribute" }],
  },
  {
    title: "Legal",
    pages: [
      { href: "/docs/license/", title: "License" },
      { href: "/docs/licenses/", title: "Third-party licenses" },
      { href: "/docs/accessibility/", title: "Accessibility", markdown: mdx("accessibility") },
    ],
  },
];

export const DOCS_PAGES: DocsPage[] = DOCS_SECTIONS.flatMap((section) => section.pages);

const REPO_EDIT_BASE = "https://github.com/tuxery/app/edit/main/";

/** `/docs/faq` and `/docs/faq/` are the same page. */
function normalize(pathname: string): string {
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function findDocsPage(pathname: string): DocsPage | undefined {
  const path = normalize(pathname);
  return DOCS_PAGES.find((page) => page.href === path);
}

/** The pages before and after this one in reading order (sidebar order, across sections). */
export function adjacentDocsPages(pathname: string): { prev?: DocsPage; next?: DocsPage } {
  const path = normalize(pathname);
  const index = DOCS_PAGES.findIndex((page) => page.href === path);
  if (index === -1) return {};
  return { prev: DOCS_PAGES[index - 1], next: DOCS_PAGES[index + 1] };
}

/** GitHub's editor for a Markdown page's source, `undefined` for a page written as a component. */
export function docsEditUrl(page: DocsPage | undefined): string | undefined {
  return page?.markdown ? `${REPO_EDIT_BASE}${page.markdown}` : undefined;
}

/**
 * Old standalone URLs that moved under `/docs/` — each still answers with
 * a permanent redirect (see `redirectToDocs`), so external links and
 * bookmarks keep working. `/sources/<id>/` store pages didn't move; only
 * the `/sources/` index did.
 */
export const MOVED_TO_DOCS: Record<string, string> = {
  "/about/": "/docs/",
  "/status/": "/docs/status/",
  "/contribute/": "/docs/contribute/",
  "/license/": "/docs/license/",
  "/licenses/": "/docs/licenses/",
  "/sources/": "/docs/sources/",
  "/distros/": "/docs/sources/",
};

import { test, expect } from "@playwright/test";
import { DOCS_PAGES, MOVED_TO_DOCS } from "../src/docs-nav";
import { LICENSE_GUIDE_PATH, LICENSE_GUIDE_SECTIONS } from "../src/license";

// Every page listed in the docs sidebar (`DOCS_PAGES`) renders a real h1 —
// covers both the component pages and the Markdown (MDX) ones, so a page
// added to the nav without its route (or the reverse) fails here.
for (const { href } of DOCS_PAGES) {
  test(`${href} renders a heading`, async ({ page }) => {
    const response = await page.goto(href);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

for (const [from, to] of Object.entries(MOVED_TO_DOCS)) {
  test(`${from} permanently redirects to ${to}`, async ({ request }) => {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(response.headers().location).toBe(to);
  });
}

test("the header's Guides and About entries lead into the docs, each highlighted on its pages", async ({
  page,
}) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await header.getByRole("link", { name: "Guides" }).click();
  await expect(page).toHaveURL(/\/docs\/faq\/$/);
  await expect(header.getByRole("link", { name: "Guides" })).toHaveAttribute(
    "aria-current",
    "true",
  );

  await header.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/docs\/$/);
  await expect(page.getByRole("heading", { name: "About Tuxery", level: 1 })).toBeVisible();
  await expect(header.getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "true");

  const sidebar = page.getByRole("navigation", { name: "Docs sidebar" });
  await sidebar.getByRole("link", { name: "Glossary" }).click();
  await expect(header.getByRole("link", { name: "Guides" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page).toHaveURL(/\/docs\/glossary\/$/);
  await expect(sidebar.getByRole("link", { name: "Glossary" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("link", { name: "Edit this page on GitHub" })).toHaveAttribute(
    "href",
    /\/src\/routes\/docs\/glossary\/index\.mdx$/,
  );
  await expect(page.getByRole("link", { name: /Next/ })).toHaveAttribute(
    "href",
    "/docs/open-source-licenses/",
  );
});

test("a glossary entry can be linked to directly", async ({ page }) => {
  await page.goto("/docs/glossary/#edition");
  await expect(page.locator("h3#edition")).toBeInViewport();
});

test("the per-source to-do lists real app counts and its tracked issues", async ({ page }) => {
  await page.goto("/docs/coverage/");
  const flathub = page.getByRole("row").filter({ hasText: "flatpak-flathub" });
  const count = await flathub.getByRole("cell").nth(1).innerText();
  expect(Number(count.replace(/[^0-9]/g, ""))).toBeGreaterThan(0);
  await expect(
    flathub.locator("a[href^='https://github.com/tuxery/catalog/issues/']").first(),
  ).toBeVisible();
});

test("every license section the app pages link to exists on the guide", async ({ page }) => {
  await page.goto(LICENSE_GUIDE_PATH);
  for (const id of LICENSE_GUIDE_SECTIONS) {
    await expect(page.locator(`h2#${id}`), id).toHaveCount(1);
  }
});

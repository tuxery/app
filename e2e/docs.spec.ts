import { test, expect } from "@playwright/test";
import { DOCS_PAGES, MOVED_TO_DOCS } from "../src/docs-nav";

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

test("the header's Docs entry leads to the docs, with the current page highlighted", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Docs" }).click();
  await expect(page).toHaveURL(/\/docs\/$/);
  await expect(page.getByRole("heading", { name: "About Tuxery", level: 1 })).toBeVisible();

  const sidebar = page.getByRole("navigation", { name: "Docs sidebar" });
  await sidebar.getByRole("link", { name: "Glossary" }).click();
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
    "/docs/philosophy/",
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

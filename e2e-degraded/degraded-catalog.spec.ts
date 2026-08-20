import { test, expect } from "@playwright/test";

// Runs against its own dev server instance with TURSO_DB_URL deliberately
// unset (see playwright.degraded.config.ts) — catalog.ts's getClient()
// returns null in that case, and every query function degrades to an
// empty result via safely() rather than throwing. This is the regression
// test for that whole design: every page should still render its real
// empty state, never a 500.
const PAGES = ["/", "/browse/", "/apps/", "/games/", "/categories/", "/distros/", "/about/"];

for (const path of PAGES) {
  test(`${path} renders without a server error when the catalog is unreachable`, async ({
    page,
  }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(500);
  });
}

test("the homepage explains the empty state instead of showing a broken layout", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("No catalog data loaded")).toBeVisible();
});

test("a detail page 404s cleanly rather than crashing", async ({ page }) => {
  const response = await page.goto("/app/flatpak-flathub%3Aorg.mozilla.firefox/");
  expect(response?.status()).toBe(404);
});

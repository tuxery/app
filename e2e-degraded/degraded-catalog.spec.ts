import { test, expect } from "@playwright/test";

// Runs against its own dev server instance with TURSO_DB_URL deliberately
// unset (see playwright.degraded.config.ts) — catalog.ts's getClient()
// returns null in that case, which counts as the catalog being unavailable
// (`isCatalogAvailable`). This is the regression test for the outage
// experience: a general-audience message instead of an empty store, a 503
// where the page's content is missing, nothing cached at the edge — and
// never a crash.

// Pages whose content comes from the catalog: 503, with the message.
const CATALOG_PAGES = ["/", "/browse/", "/apps/", "/games/", "/categories/", "/app/firefox/"];
// Pages that don't need it: still 200, with the message.
const OTHER_PAGES = ["/docs/", "/docs/status/", "/docs/coverage/", "/docs/glossary/", "/settings/"];

const MESSAGE = "The catalog is temporarily unavailable.";

for (const path of CATALOG_PAGES) {
  test(`${path} answers 503, uncached, with the outage message`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(503);
    expect(response?.headers()["cache-control"]).toContain("no-store");
    await expect(page.getByText(MESSAGE)).toBeVisible();
  });
}

for (const path of OTHER_PAGES) {
  test(`${path} still answers 200, uncached, with the outage message`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["cache-control"]).toContain("no-store");
    await expect(page.getByText(MESSAGE)).toBeVisible();
  });
}

test("no developer instructions reach the page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("pnpm seed")).toHaveCount(0);
});

test("an app page says it can't be loaded, not that the app doesn't exist", async ({ page }) => {
  await page.goto("/app/firefox/");
  await expect(
    page.getByRole("heading", { name: "This app can't be loaded right now", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("App not found")).toHaveCount(0);
});

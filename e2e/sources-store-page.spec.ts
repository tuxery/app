import { test, expect } from "@playwright/test";

// /sources/[id]/ — a dedicated per-store page (Flathub, Snap Store,
// AppImageHub, GOG, Lutris), linked from each of those sources on
// /docs/sources/ and, but for GOG, from the homepage's store tiles.
test("the sources page links to a store's own page", async ({ page }) => {
  await page.goto("/docs/sources/");
  await page.getByRole("link", { name: "Store page" }).first().click();
  await expect(page).toHaveURL(/\/sources\/flatpak-flathub\/$/);
});

test("a per-source store page shows real trending apps from that source @private-caches", async ({
  page,
}) => {
  await page.goto("/sources/flatpak-flathub/");
  await expect(page.getByRole("heading", { name: "Flathub", level: 1 })).toBeVisible();
  await expect(page.locator("a[href^='/app/']").first()).toBeVisible();

  await expect(page.getByRole("link", { name: "Visit Flathub" })).toHaveAttribute(
    "href",
    "https://flathub.org",
  );
});

test("the homepage's AppImageHub tile opens its store page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "AppImageHub", exact: true }).first().click();
  await expect(page).toHaveURL(/\/sources\/appimagehub\/$/);
  await expect(page.getByRole("heading", { name: "AppImageHub", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Visit AppImageHub" })).toHaveAttribute(
    "href",
    "https://www.appimagehub.com",
  );
});

test("an unknown source id 404s cleanly", async ({ page }) => {
  const response = await page.goto("/sources/not-a-real-source/");
  expect(response?.status()).toBe(404);
});

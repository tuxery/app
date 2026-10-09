import { test, expect } from "@playwright/test";

// /sources/[id]/ — a dedicated per-store page (Flathub, Snap Store, GOG,
// Lutris), linked from each of those sources on /docs/sources/.
test("the sources page links to a store's own page", async ({ page }) => {
  await page.goto("/docs/sources/");
  await page.getByRole("link", { name: "Store page" }).first().click();
  await expect(page).toHaveURL(/\/sources\/flatpak-flathub\/$/);
});

test("a per-source store page shows real trending apps from that source", async ({ page }) => {
  await page.goto("/sources/flatpak-flathub/");
  await expect(page.getByRole("heading", { name: "Flathub", level: 1 })).toBeVisible();
  await expect(page.locator("a[href^='/app/']").first()).toBeVisible();

  await expect(page.getByRole("link", { name: "Visit Flathub" })).toHaveAttribute(
    "href",
    "https://flathub.org",
  );
});

test("an unknown source id 404s cleanly", async ({ page }) => {
  const response = await page.goto("/sources/not-a-real-source/");
  expect(response?.status()).toBe(404);
});

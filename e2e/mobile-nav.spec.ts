import { test, expect } from "@playwright/test";

// Runs against the "mobile-chromium" project only (see playwright.config.ts) —
// the nav links are hidden below the `lg` breakpoint, with this dropdown as
// the only way to reach them on a small viewport.
test("the mobile nav dropdown opens and navigates to a real page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();

  // Scoped to the dropdown menu specifically — the footer repeats the same
  // "Games" link on every page, so an unscoped locator matches both.
  const gamesLink = page.getByRole("menu").getByRole("link", { name: "Games", exact: true });
  await expect(gamesLink).toBeVisible();
  await gamesLink.click();

  await expect(page).toHaveURL(/\/games\/?$/);
  await expect(page.getByRole("heading", { name: "Games", exact: true })).toBeVisible();
});

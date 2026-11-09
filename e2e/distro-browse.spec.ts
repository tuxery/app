import { test, expect } from "@playwright/test";

test("a source link on /docs/sources leads to filtered, non-empty /browse results", async ({
  page,
}) => {
  await page.goto("/docs/sources/");
  await expect(page.getByRole("heading", { name: "Sources", level: 1 })).toBeVisible();

  // Lutris specifically — a small group, so a real result is a strong signal
  // the filter worked. Not GOG: its cache is private, so CI's dataset has none.
  await page
    .locator(".card")
    .filter({ has: page.getByRole("heading", { name: "Lutris", exact: true }) })
    .getByRole("link", { name: "Browse this source" })
    .click();

  await expect(page).toHaveURL(/\/browse\/\?source=lutris/);
  await expect(page.getByText("Filtering by:")).toBeVisible();
  await expect(page.locator("a[href^='/app/']").first()).toBeVisible();
});

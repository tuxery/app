import { test, expect } from "@playwright/test";

test("a source link on /distros leads to filtered, non-empty /browse results", async ({ page }) => {
  await page.goto("/distros/");
  await expect(page.getByRole("heading", { name: "Browse by source" })).toBeVisible();

  // GOG specifically — a small, single-source group with no cross-source
  // merging noise, so a real result is a strong signal the filter worked.
  await page.getByRole("link", { name: "GOG", exact: true }).click();

  await expect(page).toHaveURL(/\/browse\/\?source=gog/);
  await expect(page.getByText("Filtering by:")).toBeVisible();
  await expect(page.locator("a[href^='/app/']").first()).toBeVisible();
});

import { test, expect } from "@playwright/test";

// The core "find and install" path: header search -> /browse results ->
// an app's own detail page. Firefox is used as the search term since it's
// present across enough sources to be a stable anchor in the real catalog.
test("searching from the header lands on real /browse results, and a result opens a real detail page", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByPlaceholder("Search for an app or game…").fill("firefox");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/browse\/\?q=firefox/);
  // exact: true — "Browse" alone would also substring-match result cards
  // like "browser-vacuum" or "camofox-browser-bin".
  await expect(page.getByRole("heading", { name: "Browse", exact: true })).toBeVisible();

  const firstResult = page.locator("a[href^='/app/']").first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  await expect(page).toHaveURL(/\/app\//);
  // "Available via" is only ever rendered once real package data loaded —
  // a degraded/empty catalog would 404 before reaching this point instead.
  await expect(page.getByText("Available via")).toBeVisible();
});

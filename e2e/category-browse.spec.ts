import { test, expect } from "@playwright/test";

test("a category card on /categories leads to filtered, non-empty /browse results", async ({
  page,
}) => {
  await page.goto("/categories/");
  await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();

  const firstCategory = page.locator("a[href*='/browse/?category=']").first();
  const categoryName = await firstCategory.locator(".font-medium").innerText();
  await firstCategory.click();

  await expect(page).toHaveURL(/\/browse\/\?category=/);
  // The clicked category's name should appear in the active-filter chip —
  // confirms the query param actually took effect, not just that the page
  // loaded.
  await expect(page.getByText("Filtering by:")).toBeVisible();
  await expect(page.locator(".badge", { hasText: categoryName })).toBeVisible();
  await expect(page.locator("a[href^='/app/']").first()).toBeVisible();
});

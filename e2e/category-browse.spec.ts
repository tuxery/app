import { test, expect } from "@playwright/test";

test("a category card on /categories leads to filtered, non-empty /browse results", async ({
  page,
}) => {
  await page.goto("/categories/");
  await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();

  // Scoped to the actual grid tiles (`.card`), not just any link to
  // /browse/?category= — the intro paragraph's own "To Classify" link
  // matches the bare href pattern too and would otherwise win `.first()`.
  const firstCategory = page.locator("a.card[href*='/browse/?category=']").first();
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

test("the To Classify category shows a 'suggest a category' banner, not shown on a real category", async ({
  page,
}) => {
  await page.goto("/browse/?category=To+Classify");
  const banner = page.getByText("isn't a real category");
  await expect(banner).toBeVisible();
  await expect(page.getByRole("link", { name: "Suggest a category" })).toHaveAttribute(
    "href",
    "https://github.com/tuxery/catalog/issues/new?template=report-problem.yml",
  );

  await page.goto("/browse/?category=Productivity");
  await expect(banner).toHaveCount(0);
});

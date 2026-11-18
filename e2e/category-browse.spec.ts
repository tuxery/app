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

test("/categories lists AI in its own group, and its card leads to AI apps", async ({ page }) => {
  await page.goto("/categories/");
  await expect(page.getByRole("heading", { name: "Artificial intelligence" })).toBeVisible();
  await page.locator("a.card[href='/browse/?category=AI']").click();

  await expect(page).toHaveURL(/\/browse\/\?category=AI$/);
  await expect(page.locator(".badge", { hasText: "AI" })).toBeVisible();
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

test("a link to a category that was split opens the group listing its parts", async ({ page }) => {
  await page.goto("/browse/?category=Internet+%26+Communication");
  await expect(page).toHaveURL(/\/categories\/#internet$/);
  const group = page.locator("#internet");
  await expect(group.locator("a.card", { hasText: "Web Browsers" })).toBeVisible();
  await expect(group.locator("a.card", { hasText: "Messaging & Calls" })).toBeVisible();
});

test("a product page's breadcrumb leads to its type's and its category's listings", async ({
  page,
}) => {
  await page.goto("/app/firefox/");
  const trail = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(trail.getByRole("link", { name: "Apps" })).toHaveAttribute(
    "href",
    "/browse/?type=app",
  );
  await expect(trail.getByRole("link", { name: "Web Browsers" })).toHaveAttribute(
    "href",
    "/browse/?category=Web%20Browsers",
  );
});

test("a category's listing offers its subcategories, and one narrows the results", async ({
  page,
}) => {
  await page.goto("/browse/?category=Security");
  const kinds = page.getByRole("navigation", { name: "Kinds of Security" });
  await expect(kinds.getByRole("link", { name: "All", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await kinds.getByRole("link", { name: /^Passwords & Authentication/ }).click();

  await expect(page).toHaveURL(/[?&]sub=Passwords\+%26\+Authentication/);
  await expect(kinds.getByRole("link", { name: /^Passwords & Authentication/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.locator(".badge", { hasText: "Passwords & Authentication" })).toBeVisible();
  await expect(page.locator("a[href='/app/keepassxc/']")).toBeVisible();
});

test("a subcategory that isn't the category's is ignored", async ({ page }) => {
  await page.goto("/browse/?category=Security&sub=Version+Control");
  await expect(page.locator(".badge", { hasText: "Version Control" })).toHaveCount(0);
  await expect(page.locator("a[href^='/app/']").first()).toBeVisible();
});

test("a link to the former Settings category opens Desktop & Settings", async ({ page }) => {
  await page.goto("/browse/?category=Settings");
  await expect(page).toHaveURL(/\/browse\/\?category=Desktop%20%26%20Settings$/);
  await expect(page.locator(".badge", { hasText: "Desktop & Settings" })).toBeVisible();
});

test("a product page's breadcrumb ends at its subcategory", async ({ page }) => {
  await page.goto("/app/keepassxc/");
  const trail = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(trail.getByRole("link", { name: "Passwords & Authentication" })).toHaveAttribute(
    "href",
    "/browse/?category=Security&sub=Passwords%20%26%20Authentication",
  );
});

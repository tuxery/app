import { test, expect } from "@playwright/test";

test("a category's page shows its top 10, its subcategories and all its apps", async ({ page }) => {
  await page.goto("/categories/graphics-and-design/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Graphics & Design");
  const trail = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(trail.getByRole("link", { name: "Apps" })).toHaveAttribute("href", "/apps/");

  await expect(
    page.getByRole("list", { name: "Most popular apps" }).getByRole("listitem"),
  ).toHaveCount(10);

  const narrow = page.locator("section", {
    has: page.getByRole("heading", { name: "Narrow it down" }),
  });
  const firstSub = narrow.getByRole("link").first();
  await expect(firstSub).toHaveAttribute(
    "href",
    /^\/categories\/graphics-and-design\/[a-z0-9-]+\/$/,
  );
  await expect(firstSub.locator("img").first()).toBeAttached();

  const all = page.locator("section", {
    has: page.getByRole("heading", { name: /^All [\d,]+ apps$/ }),
  });
  await expect(all.getByRole("link", { name: "Search and filter" })).toHaveAttribute(
    "href",
    "/browse/?category=Graphics%20%26%20Design",
  );
  await expect(all.locator("article.card")).toHaveCount(30);
  // The next page loads as the end of the list comes into view.
  await page.getByRole("button", { name: "Show more" }).scrollIntoViewIfNeeded();
  await expect
    .poll(() => all.locator("article.card").count(), { timeout: 15_000 })
    .toBeGreaterThan(30);
});

test("a subcategory's page leads back to its category and on to the other subcategories", async ({
  page,
}) => {
  await page.goto("/categories/security/passwords-and-authentication/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Passwords & Authentication");
  const trail = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(trail.getByRole("link", { name: "Security" })).toHaveAttribute(
    "href",
    "/categories/security/",
  );
  await expect(page.locator("a[href^='/app/']").first()).toBeVisible();

  const more = page.locator("section", {
    has: page.getByRole("heading", { name: "More in Security" }),
  });
  await expect(more.getByRole("link", { name: /VPN & Privacy/ })).toHaveAttribute(
    "href",
    "/categories/security/vpn-and-privacy/",
  );
  await expect(more.getByRole("link", { name: /Passwords & Authentication/ })).toHaveCount(0);
});

test("a category with no subcategories still lists its top 10 and its apps", async ({ page }) => {
  await page.goto("/categories/web-browsers/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Web Browsers");
  await expect(page.getByRole("heading", { name: "Narrow it down" })).toHaveCount(0);
  await expect(
    page.getByRole("list", { name: "Most popular apps" }).getByRole("listitem").first(),
  ).toBeVisible();
});

test("a game genre's page leads back to /games", async ({ page }) => {
  await page.goto("/categories/role-playing/");
  const trail = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(trail.getByRole("link", { name: "Games" })).toHaveAttribute("href", "/games/");
  await expect(page.getByRole("heading", { name: "Most popular games" })).toBeVisible();
});

test("an unknown category or subcategory is a 404", async ({ page }) => {
  expect((await page.goto("/categories/not-a-category/"))?.status()).toBe(404);
  expect((await page.goto("/categories/security/not-a-subcategory/"))?.status()).toBe(404);
});

test("the pages sitemap lists the categories' and subcategories' pages", async ({ request }) => {
  const response = await request.get("/sitemaps/pages.xml");
  // A non-public deployment serves no sitemap; the dev server does.
  test.skip(response.status() === 404, "this server serves no sitemap");
  const xml = await response.text();
  expect(xml).toContain("/categories/graphics-and-design/</loc>");
  expect(xml).toContain("/categories/security/passwords-and-authentication/</loc>");
});

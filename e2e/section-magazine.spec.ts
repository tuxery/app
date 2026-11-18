import { test, expect } from "@playwright/test";

for (const { path, featured, chart } of [
  { path: "/apps/", featured: "App of the day", chart: "Trending apps" },
  { path: "/games/", featured: "Game of the day", chart: "Trending games" },
]) {
  test(`${path} opens on the pick of the day and a numbered top 10`, async ({ page }) => {
    await page.goto(path);
    const pick = page.locator("a", { hasText: featured });
    await expect(pick).toBeVisible();
    await expect(pick).toHaveAttribute("href", /^\/app\/[^/]+\/$/);

    const top = page.getByRole("list", { name: chart });
    await expect(top.getByRole("listitem")).toHaveCount(10);
    await expect(page.getByRole("heading", { level: 2, name: chart })).toBeVisible();
  });
}

test("/apps lists a category as a collection with its blurb", async ({ page }) => {
  await page.goto("/apps/");
  const collection = page.locator("section", {
    has: page.getByRole("heading", { level: 2, name: "Web browsers" }),
  });
  await expect(collection.getByText("Collection", { exact: true })).toBeVisible();
  await expect(collection.getByRole("link", { name: "Browse all" })).toHaveAttribute(
    "href",
    "/categories/web-browsers/",
  );
  await expect(
    collection.getByRole("list", { name: "Web browsers" }).getByRole("link").first(),
  ).toBeVisible();
});

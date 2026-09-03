import { test, expect } from "@playwright/test";

// The IntersectionObserver-driven "load more" on /browse/ (loadMore() in
// routes/browse/index.tsx, calling the loadBrowsePage server$ RPC) had no
// coverage — every other browse-related test only ever checks the first
// page's results.
test("scrolling to the bottom of /browse loads a second page of results", async ({ page }) => {
  await page.goto("/browse/");
  const initialCount = await page.locator("article.card").count();
  expect(initialCount).toBe(30); // BROWSE_PAGE_SIZE

  await page.locator("article.card").last().scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.locator("article.card").count(), { timeout: 10_000 })
    .toBeGreaterThan(initialCount);
});

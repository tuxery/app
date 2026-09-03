import { test, expect } from "@playwright/test";

// Regression guard for a real bug (found live, 2026-09-03): the homepage
// overflowed horizontally on mobile — `document.documentElement.scrollWidth`
// is the right check here, not a `toBeVisible()`/screenshot-based one,
// since the cause (a daisyUI tooltip's `::before` bubble, sized for its
// full text even at `opacity: 0`) never fails any element's own visibility
// check; it just quietly widens the page. `scrollWidth` catches that class
// of bug regardless of which element causes it next time.
const PAGES = ["/", "/browse/", "/app/firefox/", "/categories/", "/games/", "/status/"];

for (const path of PAGES) {
  test(`${path} has no horizontal overflow on a mobile viewport`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      scrollWidth,
      `${path}: scrollWidth (${scrollWidth}) should not exceed clientWidth (${clientWidth})`,
    ).toBeLessThanOrEqual(clientWidth);
  });
}

test("the sticky header stays pinned to the top after scrolling", async ({ page }) => {
  // Regression guard for a fix made alongside the overflow bug above:
  // `overflow-x: hidden` on <html> (the first fix tried) silently broke
  // `position: sticky` — the header started scrolling away with the page
  // instead of staying pinned. Switched to `overflow-x: clip`, which
  // doesn't turn <html> into a scroll container. This test would have
  // caught that regression; the overflow tests above would not have.
  await page.goto("/");
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(200);

  const top = await page.locator("header.navbar").evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBe(0);
});

import { test, expect, type Page } from "@playwright/test";

/**
 * A real finger swipe, via the CDP Input domain — not a script-dispatched
 * `TouchEvent` from `page.evaluate()`. Native touch-scroll is handled by
 * the browser's compositor listening to real input, not to DOM events; a
 * `TouchEvent` constructed and dispatched from page script reaches
 * `addEventListener` handlers (there are none here — this row is a plain
 * `overflow-x-auto` div, no custom JS) but never triggers native scrolling.
 * Only genuine input injection does, which is what this — and Playwright's
 * own `mouse`/`touchscreen` methods — use under the hood.
 */
async function swipeLeft(page: Page, x: number, y: number, distance: number): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - (distance * i) / steps, y }],
    });
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

test("the trending row's horizontal scroller responds to a real touch swipe", async ({ page }) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { name: "Trending apps" });
  await heading.scrollIntoViewIfNeeded();

  const track = page.getByLabel("Trending apps", { exact: true });
  await expect(track).toBeVisible();
  const box = await track.boundingBox();
  if (!box) throw new Error("trending apps scroller has no box");

  const before = await track.evaluate((el) => el.scrollLeft);
  expect(before).toBe(0);

  await swipeLeft(page, box.x + box.width - 40, box.y + box.height / 2, 250);
  await page.waitForTimeout(400); // scroll-smooth transition

  const after = await track.evaluate((el) => el.scrollLeft);
  expect(after).toBeGreaterThan(0);
});

test("the install drawer opens and a platform section expands, both by tap", async ({ page }) => {
  await page.goto("/app/firefox/");
  await page.getByRole("button", { name: "Install" }).tap();

  const debianSummary = page.locator("summary", { hasText: "Debian" });
  await expect(debianSummary).toBeVisible();
  await expect(page.getByText("sudo apt install firefox").first()).not.toBeVisible();

  await debianSummary.tap();
  await expect(page.getByText("sudo apt install firefox").first()).toBeVisible();
});

test("searching from the homepage hero, by tap, reaches real results", async ({ page }) => {
  // No submit button in the hero form (just the input) — a mobile
  // keyboard's own "Go"/"Search" action key maps to Enter, so that's the
  // realistic touch flow here, not a button tap.
  await page.goto("/");
  const searchInput = page.getByPlaceholder("Search for an app or game…");
  await searchInput.tap();
  await searchInput.fill("firefox");
  await searchInput.press("Enter");

  await expect(page).toHaveURL(/\/browse\/\?q=firefox/);
  const titles = await page.locator("h3.card-title").allTextContents();
  expect(titles).toContain("Firefox");
});

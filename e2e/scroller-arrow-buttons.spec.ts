import { test, expect } from "@playwright/test";

// Desktop/mouse only — the arrow buttons are `hidden sm:inline-flex`
// (mobile users scroll by touch instead, see e2e/mobile-touch.spec.ts).
// Runs on the default "chromium" project.
test("the trending row's right arrow scrolls the row on click", async ({ page }) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { name: "Trending apps" });
  await heading.scrollIntoViewIfNeeded();

  const track = page.getByLabel("Trending apps", { exact: true });
  const rightArrow = page.getByRole("button", { name: "Scroll Trending apps right" });
  await expect(rightArrow).toBeVisible();

  const before = await track.evaluate((el) => el.scrollLeft);
  expect(before).toBe(0);

  await rightArrow.click();
  await expect
    .poll(() => track.evaluate((el) => el.scrollLeft), { timeout: 5000 })
    .toBeGreaterThan(0);

  const afterRight = await track.evaluate((el) => el.scrollLeft);
  const leftArrow = page.getByRole("button", { name: "Scroll Trending apps left" });
  await leftArrow.click();
  await expect
    .poll(() => track.evaluate((el) => el.scrollLeft), { timeout: 5000 })
    .toBeLessThan(afterRight);
});

test("the arrow buttons are hidden below the sm breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const heading = page.getByRole("heading", { name: "Trending apps" });
  await heading.scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Scroll Trending apps right" })).toBeHidden();
});

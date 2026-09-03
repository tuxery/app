import { test, expect } from "@playwright/test";

// The Display tab (theme switcher) had zero coverage — every other
// settings.spec.ts/os-selector.spec.ts test only ever visits ?tab=os or
// ?tab=sources.
test("picking a theme sets data-theme, persists, and survives a reload", async ({ page }) => {
  await page.goto("/settings/?tab=display");

  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dim", { timeout: 15_000 });
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("tuxery:settings")), { timeout: 15_000 })
    .toContain('"theme":"dark"');

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dim", { timeout: 15_000 });

  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "nord", { timeout: 15_000 });
});

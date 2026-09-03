import { test, expect } from "@playwright/test";
import { expectPainted } from "./_utils/painted";

// Runs against the "mobile-chromium" project only (see playwright.config.ts) —
// the nav links are hidden below the `lg` breakpoint, with this dropdown as
// the only way to reach them on a small viewport. Uses `.tap()` throughout,
// not `.click()` — this is the one flow real mobile users only ever reach by
// touch, and `.click()` alone previously let a real clipping bug (see
// `_utils/painted.ts`) through unnoticed.
const DESTINATIONS = [
  { label: "Apps", url: /\/apps\/?$/, heading: "Apps" },
  { label: "Games", url: /\/games\/?$/, heading: "Games" },
  { label: "Categories", url: /\/categories\/?$/, heading: "Categories" },
] as const;

for (const { label, url, heading } of DESTINATIONS) {
  test(`the mobile nav dropdown opens and taps through to ${label}`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).tap();

    // Scoped to the dropdown menu specifically — the footer repeats some of
    // the same links on every page, so an unscoped locator matches both.
    const link = page.getByRole("menu").getByRole("link", { name: label, exact: true });
    await expect(link).toBeVisible();
    await expectPainted(link);

    await link.tap();

    await expect(page).toHaveURL(url);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  });
}

test("the dropdown doesn't linger open (painted) after navigating away", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).tap();
  const gamesLink = page.getByRole("menu").getByRole("link", { name: "Games", exact: true });
  await gamesLink.tap();
  await expect(page).toHaveURL(/\/games\/?$/);

  // Qwik City does a client-side navigation here (no full reload) — a
  // dropdown that doesn't close on navigate would still show the old
  // page's menu open over the new page's content.
  const dropdown = page.locator(".dropdown-content");
  await expect(dropdown).toBeHidden();
});

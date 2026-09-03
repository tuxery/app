import { test, expect } from "@playwright/test";

// Smoke coverage for pages with no dynamic catalog data — previously
// untested entirely. Each just needs to actually render its real content,
// not 404 or throw.
const PAGES = [
  { path: "/about/", heading: "About Tuxery" },
  { path: "/contribute/", heading: "How to contribute" },
  { path: "/license/", heading: "License" },
  { path: "/licenses/", heading: "Third-party licenses" },
];

for (const { path, heading } of PAGES) {
  test(`${path} renders its real heading`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
  });
}

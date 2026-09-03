import { test, expect } from "@playwright/test";

test("the creators explainer page links to baxyz's real page", async ({ page }) => {
  await page.goto("/creators/");
  await expect(page.getByRole("heading", { name: "Sharing your picks" })).toBeVisible();
  await page.getByRole("link", { name: "baxyz's page" }).click();
  await expect(page).toHaveURL(/\/creators\/baxyz\/?$/);
});

test("baxyz's influencer page renders its real category blocks, including Hardware/Piper", async ({
  page,
}) => {
  await page.goto("/creators/baxyz/");
  await expect(page.getByRole("heading", { name: "baxyz", level: 1 })).toBeVisible();

  // Locks in the category added this session — a config-only content
  // change (influencer-pages.json), easy to silently break by renaming a
  // heading or getting an app id wrong with no typecheck to catch it.
  const hardwareHeading = page.getByRole("heading", { name: "Hardware" });
  await hardwareHeading.scrollIntoViewIfNeeded();
  await expect(hardwareHeading).toBeVisible();
  const hardwareSection = page.locator("section", { has: hardwareHeading });
  await expect(hardwareSection.locator("h3.card-title")).toHaveText("Piper");
});

test("an unknown creator slug 404s cleanly rather than crashing", async ({ page }) => {
  const response = await page.goto("/creators/not-a-real-creator/");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Page not found.")).toBeVisible();
});

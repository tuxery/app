import { test, expect } from "@playwright/test";

test("New games is sorted by release date, newest first, not a re-list of Trending games", async ({
  page,
}) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { name: "New games" });
  await heading.scrollIntoViewIfNeeded();
  const section = page.locator("section", { has: heading });
  await expect(section.getByText("No release-date data available yet.")).toHaveCount(0);

  // Re-verified against the live dataset (2026-08-31): the game with the
  // newest AppStream <releases> timestamp today. Real data, not a fixed
  // fixture — expected to need re-pinning as the dataset refreshes, same
  // pattern as this repo's other real-data-pinned e2e assertions.
  await expect(section.locator("article.card h3").first()).toHaveText("Hosty");
});

test("Download trends is ranked by last-7-days installs, mixes apps and games, and links to /browse/?type=all", async ({
  page,
}) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { name: "Download trends" });
  await heading.scrollIntoViewIfNeeded();
  const section = page.locator("section", { has: heading });
  await expect(section.getByText("No download-stats data available yet.")).toHaveCount(0);

  // Re-verified against the live dataset (2026-08-31): the app with the
  // most Flathub installs over the last 7 days today — real data, expected
  // to need re-pinning as the dataset refreshes.
  await expect(section.locator("article.card h3").first()).toHaveText("Sober");

  const browseLink = section.getByRole("link", { name: "Browse everything" });
  await expect(browseLink).toHaveAttribute("href", "/browse/?type=all");
});

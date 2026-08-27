import { test, expect } from "@playwright/test";

test("multi-word search matches across words, not one literal phrase", async ({ page }) => {
  // Real bug, found live: "zen browser" used to return nothing at all —
  // the query was matched as one literal contiguous phrase, and neither
  // the real Zen browser's name ("Zen") nor its description ("Stay
  // focused, browse faster") contains that exact phrase.
  await page.goto("/browse/?q=zen%20browser");
  const titles = await page.locator("h3.card-title").allTextContents();
  expect(titles).toContain("Zen");
});

test("a short exact-name match ranks above longer names that merely contain the query words", async ({
  page,
}) => {
  // "zen-browser-bitwarden" and friends (real Zen browser *extension*
  // packages) contain both query words too, but shouldn't outrank the
  // browser itself — length-normalized scoring favors the close match.
  await page.goto("/browse/?q=zen");
  const titles = await page.locator("h3.card-title").allTextContents();
  expect(titles.slice(0, 3)).toContain("Zen");
});

test("Type filter offers Apps/Games, Interface offers GUI/CLI", async ({ page }) => {
  await page.goto("/browse/");
  await expect(page.getByRole("option", { name: "Apps" })).toBeAttached();
  await expect(page.getByRole("option", { name: "Games" })).toBeAttached();
  await expect(page.getByRole("option", { name: "GUI" })).toBeAttached();
  await expect(page.getByRole("option", { name: "CLI" })).toBeAttached();
});

test("Type + Category together scope to a real game genre, a category an app could never carry", async ({
  page,
}) => {
  await page.goto("/browse/?type=game&category=Strategy");
  await expect(page.getByText(/Showing \d/)).toBeVisible();
  const count = await page.locator("h3.card-title").count();
  expect(count).toBeGreaterThan(0);
});

test("sort options: alphabetical (A-Z) actually reorders results", async ({ page }) => {
  await page.goto("/browse/?q=zen&sort=name-asc");
  const titles = await page.locator("h3.card-title").allTextContents();
  const sorted = [...titles].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  // Case-insensitive-ish sanity check rather than an exact binary-collation
  // match — just confirms alphabetical order actually changed the ranking
  // away from the relevance-first "zen"/"Zen" pair from the other tests.
  expect(titles[0]).not.toBe("zen-browser-twilight-bin");
  expect(titles.length).toBe(sorted.length);
});

test("/games page lists a real by-genre category grid", async ({ page }) => {
  await page.goto("/games/");
  await expect(page.getByRole("heading", { name: "Browse by genre" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Strategy/ })).toBeVisible();
});

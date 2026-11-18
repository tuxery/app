import { createClient } from "@libsql/client";
import { test, expect } from "@playwright/test";

test("New games is sorted by release date, newest first, not a re-list of Trending games", async ({
  page,
}) => {
  await page.goto("/games/");
  const heading = page.getByRole("heading", { name: "New games" });
  await heading.scrollIntoViewIfNeeded();
  // The block's own <section>: the innermost match.
  const section = page.locator("section", { has: heading }).last();
  await expect(section.getByText("No release-date data available yet.")).toHaveCount(0);

  // Expected order comes from the same catalog DB the page reads, not a
  // pinned game name — a pinned name broke on every dataset refresh. Checks
  // both halves: the precomputed list really is newest-first, and the block
  // renders it in that order.
  const db = createClient({
    url: process.env.TURSO_DB_URL ?? "http://127.0.0.1:8080",
    authToken: process.env.TURSO_DB_AUTH_TOKEN,
  });
  const meta = await db.execute(`SELECT value FROM meta WHERE key = 'newApps:game'`);
  const ids = (JSON.parse(meta.rows[0]?.value as string) as string[]).slice(0, 3);
  const rows = await db.execute({
    sql: `SELECT id, name, last_updated FROM apps WHERE id IN (${ids.map(() => "?").join(", ")})`,
    args: ids,
  });
  db.close();
  const byId = new Map(rows.rows.map((row) => [row.id as string, row]));
  const expected = ids.map((id) => byId.get(id)!);
  const dates = expected.map((row) => row.last_updated as string);
  expect(dates).toEqual([...dates].sort().reverse());

  const titles = section.locator("article.card h3");
  for (const [i, row] of expected.entries()) {
    await expect(titles.nth(i)).toHaveText(row.name as string);
  }
});

test("the side column lists today's categories, apps then games, each leading to its page", async ({
  page,
}) => {
  await page.goto("/");
  // A split category's id must not be linked: it only redirects back to /categories.
  await expect(page.locator("a[href*='Internet%20%26%20Communication']")).toHaveCount(0);

  const list = page.locator("section", { has: page.getByRole("heading", { name: "Categories" }) });
  await expect(list.getByRole("heading", { name: "Apps", exact: true })).toBeVisible();
  // The genres: the list right after the "Games" heading.
  const games = list
    .getByRole("heading", { name: "Games", exact: true })
    .locator("xpath=following-sibling::ul[1]");
  const link = games.getByRole("link").first();
  const genre = (await link.locator("span.truncate").innerText()).trim();
  await link.click();
  await expect(page).toHaveURL(/\/categories\/[a-z0-9-]+\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(genre);
});

test("picking a system on the OS line keeps it, and Change offers the systems again", async ({
  page,
}) => {
  await page.goto("/");
  const line = page.locator("section", { has: page.getByRole("heading", { level: 1 }) });
  await line.getByRole("button", { name: "Fedora" }).click();
  await expect(line.getByText("Install options for")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("tuxery:settings")), { timeout: 15_000 })
    .toContain('"osId":"fedora"');
  await expect(page.locator("header").getByRole("link", { name: "Fedora" })).toBeVisible();

  await line.getByRole("button", { name: "Change" }).click();
  await expect(line.getByRole("button", { name: "Ubuntu" })).toBeVisible();
});

test("the featured creator card asks its question and leads to the creator's page", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.getByRole("link", { name: /What does .+ really install\?/ });
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("href", /^\/creators\/[^/]+\/$/);
  await expect(page.getByRole("heading", { name: "Also featured" }).first()).toBeAttached();
});

test("today's pick, the must-haves and the Explore tiles fill in from the listings", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText(/^(App|Game) of the day$/)).toBeVisible();
  await expect(page.getByLabel("Must-have apps", { exact: true })).toBeVisible();

  const explore = page.locator("section", { has: page.getByRole("heading", { name: "Explore" }) });
  const tiles = explore.locator("div.grid > a");
  await expect(tiles).toHaveCount(9);
  await expect(tiles.first().locator("img").first()).toBeAttached();
});

import { createClient } from "@libsql/client";
import { test, expect } from "@playwright/test";

test("New games is sorted by release date, newest first, not a re-list of Trending games", async ({
  page,
}) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { name: "New games" });
  await heading.scrollIntoViewIfNeeded();
  const section = page.locator("section", { has: heading });
  await expect(section.getByText("No release-date data available yet.")).toHaveCount(0);

  // Expected order comes from the same catalog DB the page reads, not a
  // pinned game name — a pinned name broke on every dataset refresh. Checks
  // both halves: the precomputed list really is newest-first, and the row
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

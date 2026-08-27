import { test, expect } from "@playwright/test";

/** No `<img>` on a card means AppCard fell back to its generic placeholder icon — the exact thing homepage/trending should now filter out. */
async function placeholderCount(page: import("@playwright/test").Page): Promise<number> {
  const cards = page.locator("article.card");
  const count = await cards.count();
  let placeholders = 0;
  for (let i = 0; i < count; i++) {
    if ((await cards.nth(i).locator("img").count()) === 0) placeholders++;
  }
  return placeholders;
}

test("homepage trending/category rows only show apps with a real icon or screenshot", async ({
  page,
}) => {
  await page.goto("/");
  const cards = page.locator("article.card");
  await expect(cards.first()).toBeVisible();
  expect(await placeholderCount(page)).toBe(0);
});

test("/apps, /games trending rows only show apps with a real icon or screenshot", async ({
  page,
}) => {
  for (const path of ["/apps/", "/games/"]) {
    await page.goto(path);
    const cards = page.locator("article.card");
    await expect(cards.first()).toBeVisible();
    expect(await placeholderCount(page)).toBe(0);
  }
});

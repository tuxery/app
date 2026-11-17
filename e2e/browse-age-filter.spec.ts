import { test, expect, type Page } from "@playwright/test";

/** The listing's total, from its "Showing 1,234 apps across ..." line. */
async function shownTotal(page: Page): Promise<number> {
  const text = await page.getByText(/^Showing [\d,]+/).innerText();
  return Number(/^Showing ([\d,]+)/.exec(text)?.[1]?.replaceAll(",", ""));
}

test("the Suitable for filter lists rated products only, each in a bracket at or under it", async ({
  page,
}) => {
  await page.goto("/browse/?type=game");
  const ageSelect = page.getByLabel("Suitable for");
  await expect(ageSelect).toHaveValue("");
  const allGames = await shownTotal(page);

  await ageSelect.selectOption({ label: "12+" });
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page).toHaveURL(/[?&]age=12(&|$)/);
  await expect(page.getByLabel("Suitable for")).toHaveValue("12");
  await expect(page.getByText(/lists products rated 12\+ or lower/)).toBeVisible();

  // Far fewer than every game: unrated ones never match an age.
  const suitable = await shownTotal(page);
  expect(suitable).toBeGreaterThan(0);
  expect(suitable).toBeLessThan(allGames);

  // A listed game's page shows a bracket of 12 or less.
  await page.locator("a[href^='/app/']").first().click();
  await expect(page).toHaveURL(/\/app\//);
  await expect(
    page
      .getByRole("link", { name: /^(All ages|7\+|12\+)$/ })
      .and(page.locator("a[href='/docs/glossary/#age-rating']")),
  ).toBeVisible();
});

test("a product page shows its age bracket, the age it rounds up, and Unrated when nothing rates it", async ({
  page,
}) => {
  const badge = page.locator("a.badge[href='/docs/glossary/#age-rating']");

  // 0 A.D.: OARS 14 at its strictest, a 16+ bracket.
  await page.goto("/app/0ad/");
  await expect(badge).toHaveText("16+");
  await expect(badge).toHaveAttribute("title", /^Suitable for: 16\+ \(minimum age 14\+/);

  await page.goto("/app/gcompris/");
  await expect(badge).toHaveText("All ages");

  // htop: no source rates it, which is not all ages.
  await page.goto("/app/htop/");
  await expect(badge).toHaveText("Unrated");
  await expect(badge).toHaveAttribute("title", /^Unrated: /);
});

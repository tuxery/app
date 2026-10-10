import { test, expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** The tooltip text a `HoverTip` trigger is described by (focusable triggers, on the product page). */
async function tipText(page: Page, trigger: Locator): Promise<string> {
  const id = await trigger
    .locator("xpath=ancestor-or-self::button[1]")
    .getAttribute("aria-describedby");
  return (await page.locator(`[id="${id}"]`).textContent()) ?? "";
}

// Ids that carry a Flatpak or Snap package use that package's own
// globally-unique name/appId directly (Snap preferred — see catalog's
// match/group.ts's buildAppId), no "source:" prefix; The Witcher 2 and
// LibreOffice Writer have neither, so they still fall back to
// "source:appId".
const FIREFOX = "/app/firefox/";
// gog:firewatch left the dataset (2026-10-04) — The Witcher 2 is GOG-only
// rated (no other source carries a rating) and GOG's most-rated title.
const WITCHER_2 = "/app/gog%3Athe_witcher_2/";
// LibreOffice no longer carries suite_json in the live dataset (re-verified
// 2026-09-18) — Calligra is the current real example of a suite main app
// with a component.
const CALLIGRA_MAIN = "/app/org.kde.calligra/";
const CALLIGRA_PLAN = "/app/deb-debian%3Acalligraplan/";
// AppEditor: a real elementary OS app listed on both Flathub and AppCenter
// with two genuinely different ratings — the one app in the real dataset
// most well-known apps don't have (they're only rated on Flathub), needed
// to exercise UnifiedRating's per-source breakdown at all.
const APP_EDITOR = "/app/com.github.donadigo.appeditor/";
// A merged app with a large native-package fanout (many distros, all the
// default "Stable" build) plus a few AUR "-git" builds — the case that
// exposed the build-tooltip bug below (many more packages than distinct
// builds). Luanti (the project's current name) still catalogs
// under its old "minetest" app id.
const LUANTI = "/app/minetest/";

test("an app page shows an install-options drawer listing every source, each group closed by default", async ({
  page,
}) => {
  await page.goto(FIREFOX);
  await expect(page.getByRole("button", { name: "Install" })).toBeVisible();

  await page.getByRole("button", { name: "Install" }).click();
  const flatpakSummary = page.locator("summary", { hasText: "Flatpak" });
  await expect(flatpakSummary).toBeVisible();
  await expect(page.getByRole("link", { name: "Click to install" })).toHaveCount(0);

  await flatpakSummary.click();
  await expect(page.getByRole("link", { name: "Click to install" }).first()).toBeVisible();
});

test("a single-source rated app's tooltip still prefixes the figure with its source", async ({
  page,
}) => {
  await page.goto(WITCHER_2);
  const rating = page.getByText(/\d\.\d \(\d/).first();
  await expect(rating).toBeVisible();
  // Shape only, not the figures — the rating and its vote count move with
  // every dataset refresh, and the prefix is what this test is about.
  expect(await tipText(page, rating)).toMatch(/^GOG: ★ \d\.\d \([\d,]+\)$/);
  await rating.hover();
  await expect(page.locator("[popover]:popover-open")).toHaveText(/^GOG: ★/);
});

test("a multi-source rated app's tooltip lists every source, each prefixed by its own label", async ({
  page,
}) => {
  await page.goto(APP_EDITOR);
  const rating = page.getByText(/\d\.\d \(\d/).first();
  await expect(rating).toBeVisible();
  expect(await tipText(page, rating)).toMatch(
    /^Flathub \(Flatpak\): ★ \d\.\d \([\d,]+\)\nelementary AppCenter \(Flatpak\): ★ \d\.\d \([\d,]+\)$/,
  );
});

test("the build indicator's count matches the builds its tooltip names", async ({ page }) => {
  // Real bug, found live: an earlier badge counted *packages* (dozens, one
  // per distro, mostly the same build) next to a tooltip naming a handful
  // of builds. The indicator now says it in words ("3 builds", "2
  // versions") — checked against its own tooltip, by shape, since the
  // exact builds depend on the dataset.
  await page.goto(LUANTI);
  const header = page.locator("section").first();
  const trigger = header.getByRole("button", { name: /^\d+ (builds|versions|editions)/ }).first();
  await expect(trigger).toBeVisible();
  const [, count, kind] = /^(\d+) (builds|versions|editions)/.exec(await trigger.innerText()) ?? [];
  const tip = await tipText(page, trigger);
  const line = { builds: "Other builds", versions: "Versions", editions: "Editions" }[
    kind ?? "builds"
  ];
  const names = new RegExp(`^${line}: (.+)$`, "m").exec(tip)?.[1]?.split(", ") ?? [];
  // "N builds" counts the default build too; versions and editions list them all.
  expect(Number(count)).toBe(kind === "builds" ? names.length + 1 : names.length);
});

test("the Additional information table shows a real Size row, from Flathub's own download_size", async ({
  page,
}) => {
  // Flathub's /api/v2/summary/org.mozilla.firefox download_size,
  // formatted — matched by shape, since the exact figure changes with
  // every Firefox release.
  await page.goto(FIREFOX);
  const sizeRow = page.getByText("Size", { exact: true }).locator("..");
  await expect(sizeRow.getByText(/^\d+(\.\d)? MB$/)).toBeVisible();
});

test("a Flathub-verified app shows a Verified badge next to its developer, and on the Flatpak drawer row", async ({
  page,
}) => {
  await page.goto(FIREFOX);
  await expect(
    page.locator('[data-tip*="developer-identity-verified"]').getByText("Verified"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Install" }).click();
  await page.locator("summary", { hasText: "Flatpak" }).click();
  await expect(page.locator('[data-tip="Developer-identity-verified on Flathub"]')).toBeVisible();
});

test("the source dot-map's Flatpak dot names its verified status in the tooltip", async ({
  page,
}) => {
  await page.goto(FIREFOX);
  const stack = page.locator("section").first().locator(".flex.-space-x-2");
  expect(await tipText(page, stack)).toContain("Flatpak (✓ verified)");
});

test("the source stack rings a verified logo and puts the selected OS's platforms first", async ({
  page,
}) => {
  await page.goto(FIREFOX);
  const stack = page.locator("section").first().locator(".flex.-space-x-2");
  // Flatpak leads (catalog order) and is ringed: Flathub's verified developer.
  await expect(stack.locator(":scope > span").first()).toHaveClass(/border-primary/);
  expect(await tipText(page, stack)).toMatch(/^Flatpak \(✓ verified\)/);

  await page.goto("/settings/?tab=os");
  await page.getByRole("button", { name: "Fedora", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("tuxery:settings")), { timeout: 15_000 })
    .toContain('"osId":"fedora"');

  await page.goto(FIREFOX);
  const stackWithOs = page.locator("section").first().locator(".flex.-space-x-2");
  // The OS pick applies client-side after load: poll.
  await expect
    .poll(() => tipText(page, stackWithOs))
    .toContain("Flatpak (✓ verified, used on your OS)");
  // Platforms Fedora doesn't use come after the ones it does.
  const lines = (await tipText(page, stackWithOs)).split("\n");
  const firstUnused = lines.findIndex((line) => !line.includes("used on your OS"));
  if (firstUnused >= 0)
    expect(lines.slice(firstUnused).every((line) => !line.includes("used on your OS"))).toBe(true);
});

test("an unverified platform's logo isn't ringed", async ({ page }) => {
  // LM Studio: on Flathub but not in its "verified" collection.
  await page.goto("/app/ai.lmstudio.lm-studio/");
  const stack = page.locator("section").first().locator(".flex.-space-x-2");
  expect(await tipText(page, stack)).toBe("Flatpak\nArch Linux");
  await expect(stack.locator(":scope > span").first()).toHaveClass(/border-base-300/);
});

test("Claim this listing links to the claim explainer, personalized with the app's name, and back again", async ({
  page,
}) => {
  await page.goto(FIREFOX);
  // In the header, under Install (the info cards repeat it further down).
  await page.getByRole("link", { name: "Claim this listing" }).first().click();

  await expect(page).toHaveURL("/claim/?app=firefox");
  await expect(page.getByRole("heading", { name: "Claim Firefox" })).toBeVisible();
  await expect(page.getByText("User accounts")).toBeVisible();

  await page.getByRole("link", { name: "← Back to Firefox" }).click();
  await expect(page).toHaveURL(FIREFOX);
});

test("the claim page falls back to a generic heading with no ?app given", async ({ page }) => {
  await page.goto("/claim/");
  await expect(page.getByRole("heading", { name: "Claim your listing" })).toBeVisible();
});

test("suite navigation: main app lists its components, and a component links back", async ({
  page,
}) => {
  await page.goto(CALLIGRA_MAIN);
  await expect(page.getByRole("heading", { name: "Suite components" })).toBeVisible();
  await page.getByRole("link", { name: "Calligra Plan" }).click();

  await expect(page).toHaveURL(new RegExp(CALLIGRA_PLAN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const backLink = page.getByRole("link", { name: /Part of Calligra/ });
  await expect(backLink).toBeVisible();
  await backLink.click();
  await expect(page).toHaveURL(new RegExp(CALLIGRA_MAIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("a product page lists its relations and add-ons, linking related products", async ({
  page,
}) => {
  await page.goto(FIREFOX);
  const related = page.getByRole("heading", { name: "Related", exact: true });
  // Catalog datasets published before product families carry neither.
  test.skip((await related.count()) === 0, "dataset predates catalog's product families");

  // Firefox's curated forks (catalog's config/family-relations.json).
  await expect(page.getByText("Forks", { exact: true })).toBeVisible();
  // Related apps are cards now; the similar-apps row follows.
  await expect(page.getByRole("link").filter({ hasText: "LibreWolf" }).first()).toHaveAttribute(
    "href",
    /^\/app\/[^/]+\/$/,
  );
  // Then the same category's apps, titled with the category alone.
  await expect(
    page.getByRole("heading", { name: "Internet & Communication", level: 3 }),
  ).toBeVisible();

  // Hundreds of language packs, collapsed by kind with their full count.
  await expect(page.getByRole("heading", { name: "Add-ons", exact: true })).toBeVisible();
  const languagePacks = page.locator("summary", { hasText: /^Language packs \(\d+\)$/ });
  await expect(languagePacks).toBeVisible();
  await languagePacks.click();
  await expect(page.getByText(/^The 100 most widely packaged of \d+\.$/)).toBeVisible();
});

test("Firefox's Edition and Version pickers switch to that release line's own page", async ({
  page,
}) => {
  await page.goto(FIREFOX);
  const edition = page.getByRole("button", { name: "Edition: Standard" }).first();
  // Catalog datasets published before product families carry no tracks.
  test.skip((await edition.count()) === 0, "dataset predates catalog's product families");

  await edition.click();
  await page.getByRole("menuitem", { name: "ESR" }).first().click();
  await expect(page).toHaveURL(/\/app\/firefox\/esr\/$/);
  await expect(page.getByRole("button", { name: "Edition: ESR" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Install" }).first().click();
  await page.locator("summary", { hasText: "Debian" }).click();
  await expect(page.getByText("sudo apt install firefox-esr")).toBeVisible();

  // A path naming no release line of this product goes back to its page.
  await page.goto("/app/firefox/no-such-edition/");
  await expect(page).toHaveURL(/\/app\/firefox\/$/);
});

test("the license, Flathub installs and latest release show on the default build only", async ({
  page,
}) => {
  await page.goto("/app/firefox/");
  // Links to what the license lets you do, in the licenses guide.
  const badge = page.getByRole("link", { name: /Free software/ });
  await expect(badge).toHaveAttribute("href", "/docs/open-source-licenses/#mpl-20");
  await expect(page.getByText("Installs", { exact: true })).toBeVisible();
  await expect(page.getByText("Latest release", { exact: true })).toBeVisible();

  // An edition the Flathub figures don't describe: no installs, no date.
  await page.goto("/app/firefox/esr/");
  await expect(page.getByRole("link", { name: /Free software/ })).toBeVisible();
  await expect(page.getByText("Installs", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Latest release", { exact: true })).toHaveCount(0);
});

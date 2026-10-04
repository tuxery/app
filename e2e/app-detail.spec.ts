import { test, expect } from "@playwright/test";

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
// default "Stable" channel) plus a few AUR "-git" builds — the case that
// exposed the channel-tooltip bug below (many more packages than distinct
// channel words). Luanti (the project's current name) still catalogs
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
  await expect(page.getByText(/\d\.\d \(\d/).first()).toBeVisible();
  // Shape only, not the figures — the rating and its vote count move with
  // every dataset refresh, and the prefix is what this test is about.
  await expect(page.getByTitle(/^GOG: ★ \d\.\d \([\d,]+\)$/)).toBeVisible();
});

test("a multi-source rated app's tooltip lists every source, each prefixed by its own label", async ({
  page,
}) => {
  await page.goto(APP_EDITOR);
  await expect(page.getByText(/\d\.\d \(\d/).first()).toBeVisible();
  await expect(
    page.getByTitle(
      /^Flathub \(Flatpak\): ★ \d\.\d \([\d,]+\), elementary AppCenter \(Flatpak\): ★ \d\.\d \([\d,]+\)$/,
    ),
  ).toBeVisible();
});

test("the build-channel badge counts distinct channels, not raw packages", async ({ page }) => {
  // Real bug, found live: an earlier version badged the *package* count
  // (dozens — one per distro, mostly all "Stable") right next to a
  // tooltip naming only a handful of channels, which read as broken. The
  // badge is the channel count itself now, matching the tooltip it
  // explains. Exact channel set re-verified against the dataset
  // (2026-10-04) — Luanti now carries 6 distinct channel words across its
  // dozens of packages: AUR's git build, Gentoo's "testing" keyword, and
  // Lutris' raw Flathub-branch/version installers on top of "Stable"
  // (Flathub and Snap now write it explicitly, same label as unset).
  const tip = "Stable, Git, Testing, Flathub latest, 0.4.17.1, 5.7.0-dev";
  await page.goto(LUANTI);
  await expect(page.getByTitle(tip)).toBeVisible();
  await expect(page.getByTitle(tip).locator(".badge")).toHaveText("6");
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
  await expect(page.locator('[title*="Flatpak ✓ verified"]').first()).toBeVisible();
});

test("the dot-map's verified dot turns bg-info/70 once the selected OS actually recommends that group, dim bg-primary/50 before that", async ({
  page,
}) => {
  await page.goto(FIREFOX);
  const dotMap = page.locator("div.grid.grid-rows-2").first();
  await expect(dotMap).toHaveAttribute("title", /Flatpak ✓ verified(?!,\s*recommended)/);
  await expect(dotMap.locator("span").first()).toHaveClass(/bg-primary\/50/);

  // Flatpak is always cross-distro-recommended, so any OS pick flips it.
  await page.goto("/settings/?tab=os");
  await page.getByRole("button", { name: "Fedora", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("tuxery:settings")), { timeout: 15_000 })
    .toContain('"osId":"fedora"');

  await page.goto(FIREFOX);
  const dotMapWithOs = page.locator("div.grid.grid-rows-2").first();
  await expect(dotMapWithOs).toHaveAttribute(
    "title",
    /Flatpak ✓ verified, recommended for your OS/,
  );
  await expect(dotMapWithOs.locator("span").first()).toHaveClass(/bg-info\/70/);
});

test("a present-but-unverified group's dot is a plain neutral gray, distinct from both a verified dot and an absent one", async ({
  page,
}) => {
  // LM Studio: on Flathub but not in its "verified" collection.
  await page.goto("/app/ai.lmstudio.lm-studio/");
  const dotMap = page.locator("div.grid.grid-rows-2").first();
  await expect(dotMap).toHaveAttribute("title", "Flatpak, Arch Linux");
  await expect(dotMap.locator("span").first()).toHaveClass(/bg-base-content\/25/);
});

test("Claim this listing links to the claim explainer, personalized with the app's name, and back again", async ({
  page,
}) => {
  await page.goto(FIREFOX);
  await page.getByRole("link", { name: "Claim this listing" }).click();

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

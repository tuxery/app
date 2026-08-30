import { test, expect } from "@playwright/test";

// Ids that carry a Flatpak or Snap package use that package's own
// globally-unique name/appId directly (Snap preferred — see catalog's
// match/group.ts's buildAppId), no "source:" prefix; Firewatch and
// LibreOffice Writer have neither, so they still fall back to
// "source:appId".
const FIREFOX = "/app/firefox/";
const FIREWATCH = "/app/gog%3Afirewatch/";
const LIBREOFFICE_MAIN = "/app/libreoffice/";
const LIBREOFFICE_WRITER = "/app/deb-debian%3Alibreoffice-writer/";
// AppEditor: a real elementary OS app listed on both Flathub and AppCenter
// with two genuinely different ratings — the one app in the real dataset
// most well-known apps don't have (they're only rated on Flathub), needed
// to exercise UnifiedRating's per-source breakdown at all.
const APP_EDITOR = "/app/com.github.donadigo.appeditor/";
// A merged app with a large native-package fanout (many distros, all the
// default "Stable" channel) plus a few AUR "-git" builds — the case that
// exposed the channel-tooltip bug below (many more packages than distinct
// channel words).
const LUANTI = "/app/luanti/";

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
  await page.goto(FIREWATCH);
  await expect(page.getByText(/\d\.\d \(\d/).first()).toBeVisible();
  await expect(page.getByTitle("GOG: ★ 3.9 (2,153)")).toBeVisible();
});

test("a multi-source rated app's tooltip lists every source, each prefixed by its own label", async ({
  page,
}) => {
  await page.goto(APP_EDITOR);
  await expect(page.getByText(/\d\.\d \(\d/).first()).toBeVisible();
  await expect(
    page.getByTitle("Flathub (Flatpak): ★ 3.1 (29), elementary AppCenter (Flatpak): ★ 3.3 (12)"),
  ).toBeVisible();
});

test("the build-channel badge counts distinct channels, not raw packages", async ({ page }) => {
  // Real bug, found live: an earlier version badged the *package* count
  // (27 — one per distro, mostly all "Stable") right next to a tooltip
  // naming only 2 channels, which read as broken. The badge is the
  // channel count itself now, matching the tooltip it explains.
  await page.goto(LUANTI);
  await expect(page.getByTitle("Stable, Git")).toBeVisible();
  await expect(page.getByTitle("Stable, Git").locator(".badge")).toHaveText("2");
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
  await page.goto(LIBREOFFICE_MAIN);
  await expect(page.getByRole("heading", { name: "Suite components" })).toBeVisible();
  await page.getByRole("link", { name: "LibreOffice Writer" }).click();

  await expect(page).toHaveURL(
    new RegExp(LIBREOFFICE_WRITER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
  const backLink = page.getByRole("link", { name: /Part of LibreOffice/ });
  await expect(backLink).toBeVisible();
  await backLink.click();
  await expect(page).toHaveURL(new RegExp(LIBREOFFICE_MAIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

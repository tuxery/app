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
// GIMP: real screenshots + About text from Flathub, plus 15 other sources
// (Snap, AUR, every native distro, ...) with neither — the per-source
// debug tabs' honest-empty-state case.
const GIMP = "/app/gimp/";

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

test("Screenshots & videos and About default to Merged, and their source tabs are shared", async ({
  page,
}) => {
  await page.goto(GIMP);
  await expect(page.getByRole("tab", { name: "Merged", exact: true }).first()).toHaveClass(
    /tab-active/,
  );
  await expect(page.locator("img[alt='']").first()).toBeVisible();
  await expect(page.getByText(/GIMP is an acronym/)).toBeVisible();

  // Switching source in the Screenshots tab bar also switches About's —
  // one shared selection, not two independent ones (debugging a merge
  // wants to see everything one source contributed at once).
  await page.getByRole("tab", { name: "Flathub (Flatpak)", exact: true }).first().click();
  await expect(
    page.getByRole("tab", { name: "Flathub (Flatpak)", exact: true }).nth(1),
  ).toHaveClass(/tab-active/);

  await page.getByRole("tab", { name: "Snap Store (stable build)", exact: true }).first().click();
  await expect(page.getByText("No screenshots from Snap Store (stable build).")).toBeVisible();
  await expect(page.getByText("No description from Snap Store (stable build).")).toBeVisible();
});

import { test, expect } from "@playwright/test";

const FIREFOX = "/app/flatpak-flathub%3Aorg.mozilla.firefox/";
const FIREWATCH = "/app/gog%3Afirewatch/";
const LIBREOFFICE_MAIN = "/app/flatpak-flathub%3Aorg.libreoffice.LibreOffice/";
const LIBREOFFICE_WRITER = "/app/deb-debian%3Alibreoffice-writer/";

test("exhaustive mode (the default) shows an install-options drawer, not a single button", async ({
  page,
}) => {
  await page.goto(FIREFOX);
  await expect(page.getByRole("button", { name: /Install options/ })).toBeVisible();

  await page.getByRole("button", { name: /Install options/ }).click();
  await expect(page.getByText(/Install via /).first()).toBeVisible();
});

test("automatic mode (set via /settings) shows a single direct install button instead", async ({
  page,
}) => {
  await page.goto("/settings/");
  await page.getByRole("radio", { name: /Automatic/ }).check();
  // The setting writes to localStorage from a client-side effect, not
  // synchronously with the click — wait for it to actually land before
  // navigating away, or the next page loads with the still-default value.
  // Default 5s poll timeout proved flaky under the full suite's 8 parallel
  // workers (observed live, repeatedly) — the settings page's persisted
  // payload got bigger once settings.ts grew from 7 to 21 install-source
  // groups, and 8 cold dev-server compiles contending at once is enough to
  // occasionally miss a 5s window. 15s has real margin without masking a
  // genuine break (the write normally lands in well under 1s).
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("tuxery:settings")), { timeout: 15_000 })
    .toContain('"ctaBehavior":"automatic"');

  await page.goto(FIREFOX);
  // Automatic mode's link text is always "Install via <source>" — no
  // drawer trigger should be present at all in this mode. getByRole (not
  // getByText) since Qwik's resumability model only wires this up once the
  // component actually hydrates, a hair after first paint — the default
  // 5s auto-wait covers it, this just needs a selector that keeps
  // re-checking against the accessible name rather than raw text nodes.
  await expect(page.getByRole("link", { name: /Install via/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Install options/ })).toHaveCount(0);
});

test("a rated app shows both the aggregate badge and a per-source ratings breakdown", async ({
  page,
}) => {
  await page.goto(FIREWATCH);
  await expect(page.getByText(/★ \d\.\d \(\d/).first()).toBeVisible();
  await expect(page.getByText("Ratings by source")).toBeVisible();
  await expect(page.getByText(/GOG: ★/)).toBeVisible();
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

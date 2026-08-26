import { test, expect } from "@playwright/test";

const FIREFOX = "/app/flatpak-flathub%3Aorg.mozilla.firefox/";
const FIREWATCH = "/app/gog%3Afirewatch/";
const LIBREOFFICE_MAIN = "/app/flatpak-flathub%3Aorg.libreoffice.LibreOffice/";
const LIBREOFFICE_WRITER = "/app/deb-debian%3Alibreoffice-writer/";

test("an app page shows an install-options drawer listing every source, each group closed by default", async ({
  page,
}) => {
  await page.goto(FIREFOX);
  await expect(page.getByRole("button", { name: /Install options/ })).toBeVisible();

  await page.getByRole("button", { name: /Install options/ }).click();
  const flatpakSummary = page.locator("summary", { hasText: "Flatpak" });
  await expect(flatpakSummary).toBeVisible();
  await expect(page.getByRole("link", { name: "Click to install" })).toHaveCount(0);

  await flatpakSummary.click();
  await expect(page.getByRole("link", { name: "Click to install" }).first()).toBeVisible();
});

test("a rated app shows both the aggregate badge and a per-source ratings breakdown", async ({
  page,
}) => {
  await page.goto(FIREWATCH);
  await expect(page.getByText(/\d\.\d \(\d/).first()).toBeVisible();
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

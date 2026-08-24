import { test, expect } from "@playwright/test";

test("groups packages by platform, one <details> per group, native package managers show a copy-paste command", async ({
  page,
}) => {
  await page.goto("/app/pacman-aur%3A0ad-data-git/");
  await page.getByRole("button", { name: /Install options/ }).click();

  // Debian and Ubuntu are two different packaging groups, each its own
  // <details> — not flattened into one raw source-per-row list.
  await expect(page.getByText("Debian", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Ubuntu", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("sudo apt install 0ad-data").first()).toBeVisible();
  await expect(page.getByText("sudo dnf install 0ad-data")).toBeVisible();
});

test("a source with a real store page (Flathub) shows a direct install button, not a command", async ({
  page,
}) => {
  await page.goto("/app/flatpak-flathub%3Aorg.mozilla.firefox/");
  await page.getByRole("button", { name: /Install options/ }).click();

  await expect(page.getByRole("link", { name: /Install via Flathub/ })).toBeVisible();
});

test("activating a source's setup persists and hides the setup step on future visits", async ({
  page,
}) => {
  await page.goto("/app/pacman-aur%3A0cc-famitracker/");
  await page.getByRole("button", { name: /Install options/ }).click();
  await expect(page.getByText("One-time — the AUR itself needs a helper")).toBeVisible();

  await page.getByRole("button", { name: "I've already done this" }).click();
  await expect(page.getByText("One-time — the AUR itself needs a helper")).toHaveCount(0);

  const stored = await page.evaluate(() => localStorage.getItem("tuxery:settings"));
  expect(stored).toContain(
    '"id":"arch-aur","label":"AUR (community)","enabled":true,"activated":true',
  );

  // Reload — the setup step should stay hidden (persisted, not just in-memory).
  await page.reload();
  await page.getByRole("button", { name: /Install options/ }).click();
  await expect(page.getByText("One-time — the AUR itself needs a helper")).toHaveCount(0);
  await expect(page.getByText("yay -S 0cc-famitracker")).toBeVisible();
});

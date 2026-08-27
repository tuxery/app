import { test, expect } from "@playwright/test";

test("a stale, pre-expansion persisted install-groups list gets merged with the current defaults, not overridden by it", async ({
  page,
}) => {
  // Real bug, found live (and re-confirmed after the settings redesign
  // that replaced enabled/sources with shown/specialRepos, and again after
  // shown/activated became a three-state off/auto/on instead of a plain
  // boolean): settings.ts's load logic used to replace the fresh default
  // installGroups outright with whatever was persisted, with no
  // reconciliation — anyone who'd visited /settings before the list grew
  // stayed stuck on their old, incomplete list forever. Simulates exactly
  // that: a pre-expansion localStorage payload with only 2 groups, current
  // (tri-state) shape.
  await page.addInitScript(() => {
    localStorage.setItem(
      "tuxery:settings",
      JSON.stringify({
        theme: "system",
        installGroups: [
          { id: "Flatpak", label: "Flatpak", shown: "auto", specialRepos: [] },
          { id: "Snap", label: "Snap", shown: "off", specialRepos: [] },
        ],
        osId: undefined,
      }),
    );
  });

  await page.goto("/settings/?tab=sources");

  // Groups added after that stale snapshot should now be present too.
  await expect(page.getByText("Nixpkgs")).toBeVisible();
  await expect(page.getByText("Fedora", { exact: true })).toBeVisible();

  // The user's own prior state for groups they already had is preserved,
  // not reset back to the default (Snap was explicitly Off in the stale
  // copy).
  const snapOff = page.locator('[aria-label="Show Snap"]').getByRole("button", { name: "Off" });
  await expect(snapOff).toHaveAttribute("aria-pressed", "true");

  // The stale copy's Flatpak group predates specialRepos entirely — Flathub
  // and AppCenter should still get appended, not silently dropped.
  await expect(page.getByText("Flathub", { exact: true })).toBeVisible();
});

test("a pre-tri-state persisted payload (old boolean shown/activated shape) is discarded in favor of fresh defaults, not merged into a broken hybrid", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "tuxery:settings",
      JSON.stringify({
        theme: "system",
        installGroups: [
          { id: "Flatpak", label: "Flatpak", shown: true, specialRepos: [] },
          { id: "Snap", label: "Snap", shown: false, specialRepos: [] },
        ],
      }),
    );
  });

  await page.goto("/settings/?tab=sources");

  // Fresh defaults, not a broken merge of the old boolean shape — Snap (a
  // real current-shape group id) resolves Auto -> effectively shown (no OS
  // selected), not stuck hidden by an old-shape "shown: false" that no
  // longer applies. Its special repo ("Snap Store") only renders at all
  // when the group resolves shown, so its presence proves the group is
  // effectively shown.
  const snapAuto = page.locator('[aria-label="Show Snap"]').getByRole("button", { name: "Auto" });
  await expect(snapAuto).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Snap Store", { exact: true })).toBeVisible();
});

test("checking a special repo in Settings persists and is Auto by default", async ({ page }) => {
  await page.goto("/settings/?tab=sources");
  const flathubRow = page.locator('[aria-label="Flathub activated"]');
  await expect(flathubRow.getByRole("button", { name: "Auto" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const flathubCommand = page.getByText("remote-add --if-not-exists flathub");
  await expect(flathubCommand).toBeVisible();

  await flathubRow.getByRole("button", { name: "On" }).click();
  await expect(flathubCommand).toHaveCount(0);

  // The setting persists from a client-side effect, not synchronously with
  // the click — same flake pattern as the other settings-write assertions
  // in this repo (see e2e/install-drawer.spec.ts), worth polling instead
  // of a single synchronous read under a busy parallel run.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("tuxery:settings")), { timeout: 15_000 })
    .toContain('"id":"flathub","label":"Flathub","activated":"on"');
});

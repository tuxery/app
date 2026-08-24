import { test, expect } from "@playwright/test";

test("a stale, pre-expansion persisted install-groups list gets merged with the current defaults, not overridden by it", async ({
  page,
}) => {
  // Real bug, found live (and re-confirmed after the settings redesign
  // that replaced enabled/sources with shown/specialRepos): settings.ts's
  // load logic used to replace the fresh default installGroups outright
  // with whatever was persisted, with no reconciliation — anyone who'd
  // visited /settings before the list grew stayed stuck on their old,
  // incomplete list forever. Simulates exactly that: a pre-expansion
  // localStorage payload with only 2 groups, current shape.
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

  await page.goto("/settings/");

  // Groups added after that stale snapshot should now be present too.
  await expect(page.getByText("Nixpkgs")).toBeVisible();
  await expect(page.getByText("Fedora", { exact: true })).toBeVisible();

  // The user's own prior state for groups they already had is preserved,
  // not reset back to the default (Snap was hidden in the stale copy).
  const snapToggle = page.getByRole("checkbox", { name: "Show Snap" });
  await expect(snapToggle).not.toBeChecked();

  // The stale copy's Flatpak group predates specialRepos entirely — Flathub
  // and AppCenter should still get appended, not silently dropped.
  await expect(page.getByRole("checkbox", { name: "Flathub" })).toBeVisible();
});

test("a pre-redesign persisted payload (old enabled/sources shape) is discarded in favor of fresh defaults, not merged into a broken hybrid", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "tuxery:settings",
      JSON.stringify({
        theme: "system",
        ctaBehavior: "exhaustive",
        installGroups: [
          { id: "flatpak", label: "Flatpak", enabled: true, sources: [] },
          { id: "snap", label: "Snap", enabled: false, sources: [] },
        ],
      }),
    );
  });

  await page.goto("/settings/");

  // Fresh defaults, not a broken merge of the old shape — Snap (a real
  // current-shape group id, "Snap") shows up shown, not stuck hidden by
  // an old-shape "snap"/enabled:false entry that no longer applies.
  const snapToggle = page.getByRole("checkbox", { name: "Show Snap" });
  await expect(snapToggle).toBeChecked();
});

test("checking a special repo in Settings persists and is unchecked by default", async ({
  page,
}) => {
  await page.goto("/settings/");
  const flathubToggle = page.getByRole("checkbox", { name: "Flathub" });
  await expect(flathubToggle).not.toBeChecked();
  const flathubCommand = page.getByText("remote-add --if-not-exists flathub");
  await expect(flathubCommand).toBeVisible();

  await flathubToggle.check();
  await expect(flathubCommand).toHaveCount(0);

  // The setting persists from a client-side effect, not synchronously with
  // the click — same flake pattern as the other settings-write assertions
  // in this repo (see e2e/install-drawer.spec.ts), worth polling instead
  // of a single synchronous read under a busy parallel run.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("tuxery:settings")), { timeout: 15_000 })
    .toContain('"id":"flathub","label":"Flathub","activated":true');
});

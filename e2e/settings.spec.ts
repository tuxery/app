import { test, expect } from "@playwright/test";

test("a stale, pre-expansion persisted install-groups list gets merged with the current defaults, not overridden by it", async ({
  page,
}) => {
  // Real bug, found live: settings.ts's load logic used to replace the
  // fresh default installGroups outright with whatever was persisted,
  // with no reconciliation — anyone who'd visited /settings before the
  // list grew (7 -> 21 groups, or any future addition) stayed stuck on
  // their old, incomplete list forever. Simulates exactly that: a
  // pre-expansion localStorage payload with only 2 groups.
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

  // Groups added after that stale snapshot should now be present too.
  await expect(page.getByText("RPM Fusion")).toBeVisible();
  await expect(page.getByText("Nixpkgs")).toBeVisible();

  // The user's own prior state for groups they already had is preserved,
  // not reset back to the default (Snap was disabled in the stale copy).
  const snapToggle = page.getByRole("checkbox", { name: "Enable Snap" });
  await expect(snapToggle).not.toBeChecked();
});

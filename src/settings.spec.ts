import { describe, expect, it } from "vitest";
import { defaultInstallGroups, mergeInstallGroups, type InstallFormatGroup } from "~/settings";

describe("mergeInstallGroups", () => {
  it("keeps the user's choices but takes labels, setups and order from the defaults", () => {
    const stored: InstallFormatGroup[] = [
      {
        id: "Snap",
        label: "Old label",
        shown: "off",
        specialRepos: [
          {
            id: "snap-store",
            label: "Snap Store",
            activated: "on",
            setup: { kind: "link", url: "https://old.example", note: "old" },
          },
        ],
      },
      { id: "Flatpak", label: "Flatpak", shown: "on", specialRepos: [] },
    ];
    const merged = mergeInstallGroups(stored, defaultInstallGroups());
    const defaults = defaultInstallGroups();

    expect(merged.map((group) => group.id)).toEqual(defaults.map((group) => group.id));
    const snap = merged.find((group) => group.id === "Snap");
    expect(snap?.label).toBe("Snap");
    expect(snap?.shown).toBe("off");
    expect(snap?.specialRepos[0]).toMatchObject({
      label: "snapd installed",
      activated: "on",
      setup: { url: "https://snapcraft.io/docs/installing-snapd" },
    });
    // Flatpak's setups predate nothing stored: they come in at their default.
    const flatpak = merged.find((group) => group.id === "Flatpak");
    expect(flatpak?.shown).toBe("on");
    expect(flatpak?.specialRepos.map((repo) => repo.activated)).toEqual(["auto", "auto"]);
  });

  it("drops groups and setups the defaults no longer have", () => {
    const merged = mergeInstallGroups(
      [{ id: "Gone", label: "Gone", shown: "on", specialRepos: [] }],
      defaultInstallGroups(),
    );
    expect(merged.some((group) => group.id === "Gone")).toBe(false);
  });
});

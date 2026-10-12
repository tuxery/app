import { describe, expect, it } from "vitest";
import {
  ageRatingTip,
  availableViaLabels,
  buildLabel,
  formatMinAge,
  formatSourceLabel,
  isInstallSource,
  provenanceInfo,
  summarizeAgeRatings,
  summarizeBuilds,
  summarizeReleaseLines,
  type PackageSourceId,
} from "~/catalog-types";

describe("builds", () => {
  it("names a build from its track, risk and flavors", () => {
    expect(buildLabel({})).toBe("Stable");
    expect(buildLabel({ track: "esr", flavors: ["bin", "locale:zh"] })).toBe("ESR · Bin · zh");
    expect(buildLabel({ risk: "nightly" })).toBe("Nightly");
    expect(buildLabel({ flavors: ["appimage"] })).toBe("AppImage");
    expect(buildLabel({ track: "devedition" })).toBe("Developer Edition");
  });

  it("still reads an older dataset's channel word", () => {
    expect(buildLabel({ channel: "stable" })).toBe("Stable");
    expect(buildLabel({ channel: "git" })).toBe("Git");
    expect(formatSourceLabel({ source: "flatpak-flathub", channel: "stable" })).toBe(
      formatSourceLabel({ source: "flatpak-flathub" }),
    );
  });

  it("deduplicates builds and labels a non-default one on its source", () => {
    expect(summarizeBuilds([{}, { channel: "stable" }, { risk: "git" }])).toEqual([
      "Stable",
      "Git",
    ]);
    expect(formatSourceLabel({ source: "pacman-aur", risk: "git" })).toMatch(/\(Git build\)$/);
  });
});

describe("provenanceInfo", () => {
  it("explains a known provenance and stays silent on an unknown one", () => {
    expect(provenanceInfo("community-patched")?.label).toBe("Community build, patched");
    expect(provenanceInfo(undefined)).toBeUndefined();
  });
});

describe("availableViaLabels", () => {
  it("lists each source and build once, leaving out metadata-only sources", () => {
    // Shape of Firefox's real packages: several AppImage feeds and Nixpkgs
    // attribute paths sharing one label, and AppStream enrichment sources
    // the catalog ships as packages but that nothing installs from.
    const packages = [
      { source: "appimage" },
      { source: "appimage" },
      { source: "nix-nixpkgs" },
      { source: "nix-nixpkgs", flavors: ["unwrapped"] },
      { source: "nix-nixpkgs" },
      { source: "deb-debian-appstream" },
      { source: "pacman-arch-appstream" },
      { source: "deb-debian", track: "esr" },
    ] as { source: PackageSourceId; flavors?: string[]; track?: string }[];
    expect(availableViaLabels(packages)).toEqual([
      "AppImage",
      "Nixpkgs",
      "Nixpkgs (Unwrapped build)",
      "Debian (ESR build)",
    ]);
  });

  it("knows which sources are install sources", () => {
    expect(isInstallSource("flatpak-flathub")).toBe(true);
    expect(isInstallSource("rpm-fedora-appstream")).toBe(false);
    expect(isInstallSource("toString")).toBe(false);
  });
});

describe("summarizeReleaseLines", () => {
  it("lists each edition with its own versions, and other builds, once each, as the pickers name them", () => {
    expect(
      summarizeReleaseLines([
        {},
        { risk: "nightly" },
        { track: "esr" },
        { track: "esr", flavors: ["bin"] },
        { flavors: ["bin", "locale:zh"] },
      ]),
    ).toEqual({
      editions: [
        { name: "Standard", versions: ["Stable", "Nightly"] },
        { name: "ESR", versions: ["Stable"] },
      ],
      otherBuilds: ["Bin", "zh"],
    });
  });
});

describe("age ratings", () => {
  it("writes the unified age as a badge", () => {
    expect(formatMinAge("0")).toBe("All ages");
    expect(formatMinAge("12")).toBe("12+");
  });

  it("lists what each source said, once, in its own system", () => {
    expect(
      summarizeAgeRatings([
        { source: "flatpak-flathub", ageRating: { system: "OARS", value: "moderate", minAge: 10 } },
        { source: "deb-debian-appstream", ageRating: { system: "OARS", value: "mild", minAge: 3 } },
        { source: "gog", ageRating: { system: "PEGI", value: "16", minAge: 16 } },
        { source: "gog", ageRating: { system: "PEGI", value: "16", minAge: 16 } },
        { source: "pacman-aur" },
      ]),
    ).toEqual([
      { label: "Flathub (Flatpak)", detail: "OARS moderate, 10+" },
      { label: "Debian AppStream", detail: "OARS mild, 3+" },
      { label: "GOG", detail: "PEGI 16" },
    ]);
  });

  it("puts the unified age first in the tooltip, then each source", () => {
    expect(
      ageRatingTip("16", [
        { source: "gog", ageRating: { system: "PEGI", value: "16", minAge: 16 } },
      ]),
    ).toBe("Minimum age: 16+ (the strictest of the sources)\nGOG: PEGI 16");
  });
});

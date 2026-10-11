import { describe, expect, it } from "vitest";
import {
  availableViaLabels,
  buildLabel,
  formatSourceLabel,
  isInstallSource,
  provenanceInfo,
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

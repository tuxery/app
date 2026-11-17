import { describe, expect, it } from "vitest";
import {
  ageRatingTip,
  availableViaLabels,
  buildLabel,
  formatMinAge,
  appAgeBracket,
  bracketForMinAge,
  formatAgeBracket,
  parseAgeFilter,
  formatSourceLabel,
  isInstallSource,
  provenanceInfo,
  summarizeAgeRatings,
  summarizeBuilds,
  summarizeRatingsBySource,
  summarizeReleaseLines,
  type PackageSourceId,
  type SourcedPackage,
} from "~/catalog-types";

describe("summarizeRatingsBySource", () => {
  it("credits ODRS for Flathub's ratings, and leaves a source's own ratings alone", () => {
    const rating = { average: 4.5, count: 10 };
    const packages = [
      { source: "flatpak-flathub", rating },
      { source: "gog", rating },
      { source: "deb-debian" },
    ] as SourcedPackage[];
    expect(summarizeRatingsBySource(packages).map((row) => row.label)).toEqual([
      "ODRS (Flathub)",
      "GOG",
    ]);
  });

  it("gives Flathub and AppCenter one shared ODRS row, since they carry the same votes", () => {
    const packages = [
      { source: "flatpak-flathub", rating: { average: 3.1, count: 26 } },
      { source: "flatpak-flathub", risk: "beta", rating: { average: 3.1, count: 26 } },
      { source: "flatpak-appcenter", rating: { average: 3.1, count: 11 } },
    ] as SourcedPackage[];
    expect(summarizeRatingsBySource(packages)).toEqual([
      {
        label: "ODRS (Flathub and elementary AppCenter)",
        average: 3.1,
        count: 26,
      },
    ]);
  });
});

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

  it("puts the bracket first in the tooltip, then each source", () => {
    expect(
      ageRatingTip({ ageRating: { system: "min-age", value: "16" }, ageBracket: 16 }, [
        { source: "gog", ageRating: { system: "PEGI", value: "16", minAge: 16 } },
      ]),
    ).toBe("Suitable for: 16+ (the strictest of the sources)\nGOG: PEGI 16");
  });

  it("names the age a bracket rounds up", () => {
    expect(
      ageRatingTip({ ageRating: { system: "min-age", value: "13" }, ageBracket: 16 }, [
        { source: "flatpak-flathub", ageRating: { system: "OARS", value: "intense", minAge: 13 } },
      ]),
    ).toBe(
      "Suitable for: 16+ (minimum age 13+, the strictest of the sources, rounded up)\nFlathub (Flatpak): OARS intense, 13+",
    );
  });

  it("says an unrated app is not all ages", () => {
    expect(ageRatingTip({}, [])).toMatch(/^Unrated: .*doesn't make it suitable for all ages/);
  });

  it("rounds a minimum age up to its bracket, as catalog does", () => {
    expect(["0", "3", "4", "7", "8", "13", "15", "17", "18"].map(bracketForMinAge)).toEqual([
      3, 3, 7, 7, 12, 16, 16, 18, 18,
    ]);
    expect(bracketForMinAge(undefined)).toBeUndefined();
    expect(bracketForMinAge("n/a")).toBeUndefined();
  });

  it("prefers catalog's bracket, and rounds the age on an older dataset without one", () => {
    expect(appAgeBracket({ ageRating: { system: "min-age", value: "13" }, ageBracket: 16 })).toBe(
      16,
    );
    expect(appAgeBracket({ ageRating: { system: "min-age", value: "5" } })).toBe(7);
    expect(appAgeBracket({})).toBeUndefined();
  });

  it("labels brackets, and unrated apps", () => {
    expect([3, 7, 12, 16, 18, undefined].map((b) => formatAgeBracket(b as never))).toEqual([
      "All ages",
      "7+",
      "12+",
      "16+",
      "18+",
      "Unrated",
    ]);
  });

  it("reads an age filter only from its own values", () => {
    expect(parseAgeFilter("7")).toBe(7);
    expect(parseAgeFilter(12)).toBe(12);
    expect(parseAgeFilter("18")).toBeUndefined();
    expect(parseAgeFilter("07x")).toBeUndefined();
    expect(parseAgeFilter(null)).toBeUndefined();
  });
});

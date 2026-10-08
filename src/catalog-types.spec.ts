import { describe, expect, it } from "vitest";
import { buildLabel, formatSourceLabel, provenanceInfo, summarizeBuilds } from "~/catalog-types";

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

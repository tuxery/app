import { describe, expect, it } from "vitest";
import type { SourcedPackage } from "~/catalog-types";
import {
  buildFacts,
  buildPath,
  editionsOf,
  hasBuild,
  packagesOf,
  parseBuildPath,
  selectEdition,
  versionsByEdition,
  versionsOf,
} from "~/product-builds";

const pkg = (overrides: Partial<SourcedPackage>): SourcedPackage => ({
  source: "pacman-aur",
  name: "firefox",
  description: "",
  version: "1",
  ...overrides,
});

const firefox = [
  pkg({}),
  pkg({ name: "firefox-nightly", risk: "nightly" }),
  pkg({ name: "firefox-esr", track: "esr" }),
  pkg({ name: "firefox-esr-beta", track: "esr", risk: "beta" }),
  pkg({ name: "firefox-developer-edition", track: "devedition" }),
];

describe("parseBuildPath / buildPath", () => {
  it("reads one segment as a version when it's a risk word, as an edition otherwise", () => {
    expect(parseBuildPath([])).toEqual({});
    expect(parseBuildPath(["nightly"])).toEqual({ risk: "nightly" });
    expect(parseBuildPath(["esr"])).toEqual({ track: "esr" });
    expect(parseBuildPath(["esr", "beta"])).toEqual({ track: "esr", risk: "beta" });
  });

  it("rejects paths that can't be a combination", () => {
    expect(parseBuildPath(["beta", "esr"])).toBeUndefined();
    expect(parseBuildPath(["esr", "lts"])).toBeUndefined();
    expect(parseBuildPath(["a", "beta", "c"])).toBeUndefined();
  });

  it("writes the shortest path, round-tripping", () => {
    expect(buildPath("firefox", {})).toBe("/app/firefox/");
    expect(buildPath("firefox", { risk: "nightly" })).toBe("/app/firefox/nightly/");
    expect(buildPath("pacman-aur:x", { track: "esr", risk: "beta" })).toBe(
      "/app/pacman-aur%3Ax/esr/beta/",
    );
  });
});

describe("editions and versions", () => {
  it("lists Standard first, and each edition's own versions from stable down", () => {
    expect(editionsOf(firefox).map((option) => option.label)).toEqual([
      "Standard",
      "ESR",
      "Developer Edition",
    ]);
    expect(versionsOf(firefox, undefined).map((option) => option.label)).toEqual([
      "Stable",
      "Nightly",
    ]);
    expect(versionsOf(firefox, "esr").map((option) => option.label)).toEqual(["Stable", "Beta"]);
  });

  it("keeps the version when switching edition if it exists there, else the most mature", () => {
    const versions = versionsByEdition(firefox);
    expect(selectEdition(versions, "esr", { risk: "nightly" })).toEqual({
      track: "esr",
      risk: undefined,
    });
    expect(selectEdition(versions, "esr", { track: "devedition", risk: "beta" })).toEqual({
      track: "esr",
      risk: "beta",
    });
  });

  it("selects one combination's packages", () => {
    expect(packagesOf(firefox, { track: "esr" }).map((p) => p.name)).toEqual(["firefox-esr"]);
    expect(hasBuild(firefox, { track: "devedition", risk: "beta" })).toBe(false);
  });
});

describe("buildFacts", () => {
  it("reads a combination's own rating, size and changelog, never another one's", () => {
    expect(
      buildFacts([
        pkg({ rating: { average: 4, count: 10 }, approxSizeBytes: 100 }),
        pkg({ rating: { average: 2, count: 30 }, changelog: "Fixes" }),
      ]),
    ).toEqual({ rating: { average: 2.5, count: 40 }, approxSizeBytes: 100, changelog: "Fixes" });
    expect(buildFacts([pkg({})])).toEqual({
      rating: undefined,
      approxSizeBytes: undefined,
      changelog: undefined,
    });
  });
});

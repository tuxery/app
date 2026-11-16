import { describe, expect, it } from "vitest";
import type { SourcedPackage } from "~/catalog-types";
import {
  buildFacts,
  buildPath,
  defaultSelection,
  editionsOf,
  hasBuild,
  movedProductPath,
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

describe("movedProductPath", () => {
  it("keeps the edition/version path under the current id", () => {
    expect(movedProductPath("firefox", "")).toBe("/app/firefox/");
    expect(movedProductPath("firefox", "esr/beta")).toBe("/app/firefox/esr/beta/");
    expect(movedProductPath("pacman-aur:x", "nightly/")).toBe("/app/pacman-aur%3Ax/nightly/");
  });

  it("encodes a segment once, whether or not the path had it encoded", () => {
    expect(movedProductPath("x", "a%20b")).toBe("/app/x/a%20b/");
    expect(movedProductPath("x", "a b")).toBe("/app/x/a%20b/");
    expect(movedProductPath("x", "100%")).toBe("/app/x/100%25/");
  });
});

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

describe("defaultSelection", () => {
  it("is Standard · Stable when the product has it", () => {
    expect(defaultSelection(firefox)).toEqual({});
  });

  it("falls back to the most mature version of a product without one", () => {
    expect(defaultSelection([pkg({ risk: "git" }), pkg({ risk: "nightly" })])).toEqual({
      track: undefined,
      risk: "nightly",
    });
    expect(defaultSelection([pkg({ track: "24", risk: "beta" })])).toEqual({
      track: "24",
      risk: "beta",
    });
  });
});

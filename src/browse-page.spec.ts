import { describe, expect, it } from "vitest";
import { MAX_PAGE_INDEX, normalizeBrowseOptions, parsePageParam, toPageIndex } from "./browse-page";

describe("parsePageParam", () => {
  it("reads a 1-based page number as a zero-based index", () => {
    expect(parsePageParam("1")).toBe(0);
    expect(parsePageParam("3")).toBe(2);
  });

  it("falls back to the first page when absent or not a page number", () => {
    for (const value of [null, "", "abc", "0", "-2", "1.5", "1e400", "NaN", " 2", "0x10"]) {
      expect(parsePageParam(value)).toBe(0);
    }
  });

  it("falls back to the first page past the last one any listing has", () => {
    expect(parsePageParam(String(MAX_PAGE_INDEX + 1))).toBe(MAX_PAGE_INDEX);
    expect(parsePageParam(String(MAX_PAGE_INDEX + 2))).toBe(0);
    expect(parsePageParam("999999")).toBe(0);
  });
});

describe("toPageIndex", () => {
  it("keeps a valid index", () => {
    expect(toPageIndex(0)).toBe(0);
    expect(toPageIndex(12)).toBe(12);
  });

  it("turns anything that can't be an OFFSET into the first page", () => {
    for (const value of [
      Number.NaN,
      Infinity,
      -1,
      2.5,
      "3",
      null,
      undefined,
      {},
      MAX_PAGE_INDEX + 1,
    ]) {
      expect(toPageIndex(value)).toBe(0);
    }
  });
});

describe("normalizeBrowseOptions", () => {
  const defaults = {
    interfaceFilter: "all",
    typeFilter: "all",
    category: undefined,
    source: undefined,
    license: undefined,
    sort: "relevance",
  };

  it("keeps the values browseApps knows", () => {
    expect(
      normalizeBrowseOptions({
        interfaceFilter: "gui",
        typeFilter: "game",
        category: "Strategy",
        source: "flatpak-flathub",
        license: "free",
        sort: "name-desc",
      }),
    ).toEqual({
      interfaceFilter: "gui",
      typeFilter: "game",
      category: "Strategy",
      source: "flatpak-flathub",
      license: "free",
      sort: "name-desc",
    });
  });

  it("takes anything else as the default", () => {
    expect(
      normalizeBrowseOptions({
        interfaceFilter: "tui",
        typeFilter: ["game"],
        category: 42,
        source: '%"source":"%',
        license: "proprietary",
        sort: "RANDOM()",
      }),
    ).toEqual(defaults);
    expect(normalizeBrowseOptions(undefined)).toEqual(defaults);
    expect(normalizeBrowseOptions("nope")).toEqual(defaults);
  });

  it("refuses a source name inherited from Object", () => {
    expect(normalizeBrowseOptions({ source: "constructor" }).source).toBeUndefined();
    expect(normalizeBrowseOptions({ source: "toString" }).source).toBeUndefined();
  });

  it("drops an empty or overlong category", () => {
    expect(normalizeBrowseOptions({ category: "" }).category).toBeUndefined();
    expect(normalizeBrowseOptions({ category: "x".repeat(101) }).category).toBeUndefined();
    expect(normalizeBrowseOptions({ category: "x".repeat(100) }).category).toHaveLength(100);
  });
});

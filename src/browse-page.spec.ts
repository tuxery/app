import { describe, expect, it } from "vitest";
import { MAX_PAGE_INDEX, parsePageParam, toPageIndex } from "./browse-page";

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

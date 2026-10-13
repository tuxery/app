import { describe, expect, it } from "vitest";
import { commitUrl, formatDateRange, parseBuildInfo, versionOf } from "./build-info";

const FULL = {
  catalog: { commit: "35e082b", date: "2026-10-12T21:30:00.000Z" },
  sources: { oldest: "2026-10-10T04:00:00.000Z", newest: "2026-10-12T21:20:11.071Z" },
};

describe("parseBuildInfo", () => {
  it("reads a well-formed row", () => {
    expect(parseBuildInfo(JSON.stringify(FULL))).toEqual(FULL);
  });

  it("keeps the well-formed part when the other is malformed", () => {
    expect(parseBuildInfo(JSON.stringify({ ...FULL, catalog: { commit: "", date: "x" } }))).toEqual(
      { sources: FULL.sources },
    );
  });

  it("is undefined for a missing, malformed or empty row", () => {
    expect(parseBuildInfo(undefined)).toBeUndefined();
    expect(parseBuildInfo("not json")).toBeUndefined();
    expect(parseBuildInfo("{}")).toBeUndefined();
    expect(
      parseBuildInfo(JSON.stringify({ sources: { oldest: "yesterday", newest: "now" } })),
    ).toBeUndefined();
  });
});

describe("versionOf", () => {
  it("turns a commit date into a dotted version", () => {
    expect(versionOf("2026-10-12T21:30:00.000Z")).toBe("2026.10.12");
  });
});

describe("formatDateRange", () => {
  it.each([
    ["2026-10-12T01:00:00Z", "2026-10-12T23:00:00Z", "12 Oct 2026"],
    ["2026-10-10T04:00:00Z", "2026-10-12T21:20:00Z", "10–12 Oct 2026"],
    ["2026-09-30T04:00:00Z", "2026-10-02T21:20:00Z", "30 Sep – 2 Oct 2026"],
    ["2026-12-28T04:00:00Z", "2027-01-03T21:20:00Z", "28 Dec 2026 – 3 Jan 2027"],
  ])("%s → %s is %s", (from, to, expected) => {
    expect(formatDateRange(from, to)).toBe(expected);
  });
});

describe("commitUrl", () => {
  it("links a commit of either repo", () => {
    expect(commitUrl("app", "a1b2c3d")).toBe("https://github.com/tuxery/app/commit/a1b2c3d");
    expect(commitUrl("catalog", "35e082b")).toBe(
      "https://github.com/tuxery/catalog/commit/35e082b",
    );
  });
});

import { describe, expect, it } from "vitest";
import { compactCount, releaseAge } from "~/app-facts";

const NOW = new Date("2026-10-10T12:00:00Z");

describe("releaseAge", () => {
  it("says how old a release is, in the largest sensible unit", () => {
    expect(releaseAge("2026-10-10T00:00:00Z", NOW)).toBe("today");
    expect(releaseAge("2026-10-09T00:00:00Z", NOW)).toBe("1 day ago");
    expect(releaseAge("2026-10-05T00:00:00Z", NOW)).toBe("5 days ago");
    expect(releaseAge("2026-07-23T00:00:00Z", NOW)).toBe("2 months ago");
    expect(releaseAge("2025-09-01T00:00:00Z", NOW)).toBe("1 year ago");
    expect(releaseAge("2022-01-01T00:00:00Z", NOW)).toBe("4 years ago");
  });

  it("says nothing without a readable date", () => {
    expect(releaseAge(undefined, NOW)).toBeUndefined();
    expect(releaseAge("not a date", NOW)).toBeUndefined();
  });
});

describe("compactCount", () => {
  it("shortens large counts", () => {
    expect(compactCount(12_351_023)).toBe("12.4M");
    expect(compactCount(50_853)).toBe("50.9K");
    expect(compactCount(830)).toBe("830");
  });
});

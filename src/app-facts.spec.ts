import { describe, expect, it } from "vitest";
import {
  compactCount,
  confidenceNotes,
  formatReleaseDate,
  releaseAge,
  storePicks,
} from "~/app-facts";

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

describe("formatReleaseDate", () => {
  it("writes the date in UTC, whatever the server's timezone", () => {
    expect(formatReleaseDate("2026-10-05T00:00:00.000Z")).toBe("October 5, 2026");
  });
});

describe("confidenceNotes", () => {
  it("turns the catalog's signals into sentences, agreement first", () => {
    expect(
      confidenceNotes({
        score: -5,
        signals: [
          {
            signal: "name-disagreement",
            delta: -15,
            detail: "Member packages disagree on name: jan / janlive.",
          },
          {
            signal: "multi-source-corroboration",
            delta: 10,
            detail: "6 independent sources agree, no disagreement signal found.",
          },
          { signal: "license-family-conflict", delta: -20, detail: "…" },
        ],
      }),
    ).toEqual([
      { tone: "good", text: "6 independent sources agree" },
      { tone: "warning", text: "Sources disagree on the name: jan / janlive" },
      { tone: "warning", text: "Sources disagree on the license" },
    ]);
  });

  it("counts a long list of names instead of printing it", () => {
    expect(
      confidenceNotes({
        score: -15,
        signals: [
          {
            signal: "name-disagreement",
            delta: -15,
            detail:
              "Member packages disagree on name: firefox / firefoxbeta / firefoxesr / firefoxnightly.",
          },
        ],
      }),
    ).toEqual([
      {
        tone: "warning",
        text: "Sources use 4 different names",
        title: "firefox / firefoxbeta / firefoxesr / firefoxnightly",
      },
    ]);
  });

  it("says nothing without signals", () => {
    expect(confidenceNotes({ score: 0, signals: [] })).toEqual([]);
    expect(confidenceNotes(undefined)).toEqual([]);
  });
});

describe("storePicks", () => {
  it("labels store selections, leaving verified to its own badge", () => {
    expect(storePicks(["verified", "featured", "recently-added"])).toEqual([
      "New on Flathub",
      "Featured on the Snap Store",
    ]);
    expect(storePicks(undefined)).toEqual([]);
  });
});

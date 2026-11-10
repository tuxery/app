import { describe, expect, it } from "vitest";
import { parseSourceTerms, recordsFor, type SourceTerms } from "~/source-terms";

const record = (verdict: string) => ({
  verdict,
  automatedFetch: "allowed",
  publicStorage: "allowed",
  attribution: null,
  fieldLicense: "MIT",
  evidence: [],
});

const TERMS: SourceTerms = {
  checkedOn: "2026-11-08",
  disclaimer: "Not legal advice.",
  sources: {
    "deb-debian": record("low-risk-no-terms"),
    "deb-debian-appstream": record("low-risk-no-terms"),
    gog: record("owner-review"),
  },
};

describe("parseSourceTerms", () => {
  it("reads the meta row's JSON, and nothing malformed", () => {
    expect(parseSourceTerms(JSON.stringify(TERMS))).toEqual(TERMS);
    expect(parseSourceTerms(undefined)).toBeUndefined();
    expect(parseSourceTerms("{not json")).toBeUndefined();
    expect(parseSourceTerms(JSON.stringify({ sources: {} }))).toBeUndefined();
  });
});

describe("recordsFor", () => {
  it("gives a distro's own record first, then its AppStream connector's", () => {
    expect(recordsFor(TERMS, "deb-debian").map((r) => r.id)).toEqual([
      "deb-debian",
      "deb-debian-appstream",
    ]);
    expect(recordsFor(TERMS, "gog").map((r) => r.id)).toEqual(["gog"]);
    expect(recordsFor(TERMS, "slackware")).toEqual([]);
  });
});

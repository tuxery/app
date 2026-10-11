import { describe, expect, it } from "vitest";
import { dataIssues } from "~/data-issues";

const complete = {
  license: "GPL-3.0-or-later",
  licenseSpdx: "GPL-3.0-or-later",
  licenseKind: "free" as const,
  shortDescription: "A text editor",
  category: "Productivity",
  iconUrl: "https://example.org/icon.png",
  screenshots: ["https://example.org/1.png"],
  homepage: "https://example.org/",
  kind: "gui" as const,
  dataConfidence: { score: 10, signals: [] },
};

const ids = (app: Parameters<typeof dataIssues>[0]) => dataIssues(app).map((issue) => issue.id);

describe("dataIssues", () => {
  it("finds nothing on a complete page", () => {
    expect(dataIssues(complete)).toEqual([]);
  });

  it("flags a license that isn't a precise SPDX id, with the raw string to fix", () => {
    const issues = dataIssues({ ...complete, license: "GPL3", licenseSpdx: undefined });
    expect(issues.map((issue) => issue.id)).toEqual(["license-not-spdx"]);
    expect(issues[0]).toMatchObject({ field: "License", current: "GPL3" });
    expect(issues[0]?.detail).toContain("GPL-3.0-only vs GPL-3.0-or-later");
    expect(
      dataIssues({ ...complete, license: "BSD", licenseSpdx: undefined })[0]?.detail,
    ).toContain("how many clauses");
  });

  it("says nothing about SPDX on a dataset that doesn't compute it", () => {
    expect(
      ids({ ...complete, license: "GPL3", licenseSpdx: undefined, licenseKind: undefined }),
    ).toEqual([]);
  });

  it("flags a missing or unclassifiable license", () => {
    expect(ids({ ...complete, license: undefined, licenseSpdx: undefined })).toEqual([
      "license-missing",
    ]);
    expect(
      ids({ ...complete, license: "custom", licenseSpdx: undefined, licenseKind: "unknown" }),
    ).toEqual(["license-not-spdx", "license-unclear"]);
  });

  it("turns the catalog's disagreement signals into issues", () => {
    expect(
      ids({
        ...complete,
        dataConfidence: {
          score: -35,
          signals: [
            { signal: "name-disagreement", delta: -15, detail: "" },
            { signal: "license-family-conflict", delta: -20, detail: "" },
          ],
        },
      }),
    ).toEqual(["license-conflict", "name-conflict"]);
  });

  it("flags missing description, category, icon, homepage — screenshots only for a GUI app", () => {
    const bare = {
      ...complete,
      shortDescription: "",
      category: "To Classify",
      iconUrl: undefined,
      screenshots: undefined,
      homepage: undefined,
    };
    expect(ids(bare)).toEqual([
      "description-missing",
      "category-missing",
      "icon-missing",
      "screenshots-missing",
      "homepage-missing",
    ]);
    expect(ids({ ...bare, kind: undefined })).not.toContain("screenshots-missing");
  });
});

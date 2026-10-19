import { describe, expect, it } from "vitest";
import { creatorPicks, type InfluencerPage } from "~/data/influencer-pages";

const page = (blocks: InfluencerPage["blocks"]): InfluencerPage => ({
  slug: "x",
  name: "x",
  tagline: "",
  blocks,
});

describe("creatorPicks", () => {
  it("counts each picked app once, across the app blocks only", () => {
    const picks = creatorPicks(
      page([
        { type: "text", body: "hello" },
        { type: "apps", appIds: ["a", "b"] },
        { type: "apps", appIds: ["b", "c"] },
      ]),
    );
    expect(picks).toMatchObject({ count: 3, groups: 2 });
    expect(picks.previewIds).toEqual(["a", "b", "c"]);
  });

  it("previews only the first few", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];
    expect(creatorPicks(page([{ type: "apps", appIds: ids }]), 4).previewIds).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("copes with a page without picks", () => {
    expect(creatorPicks(page([]))).toEqual({ count: 0, groups: 0, previewIds: [] });
  });
});

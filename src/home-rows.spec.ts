import { describe, expect, it } from "vitest";
import { HOME_ROW_SIZE, MUST_HAVE_APP_IDS, parseHomeRows } from "./home-rows";

const row = (id: string) => ({
  id,
  name: id,
  short_description: `About ${id}`,
  icon_url: null,
  kind: "gui",
  content_type: null,
  category: "Utilities",
  rating_average: null,
  rating_count: null,
  packages_json: JSON.stringify([{ source: "flatpak-flathub" }]),
});

describe("parseHomeRows", () => {
  it("turns each listing into cards, cut to a row's size", () => {
    const rows = parseHomeRows({
      "trending:app": Array.from({ length: 60 }, (_, index) => row(`app-${index}`)),
      "categoryPreview:Puzzle": [row("puzzle")],
    });
    expect(rows.trendingApps).toHaveLength(HOME_ROW_SIZE);
    expect(rows.trendingApps[0]).toMatchObject({
      id: "app-0",
      shortDescription: "About app-0",
      sources: ["flatpak-flathub"],
    });
    expect(rows.puzzleGames.map((app) => app.id)).toEqual(["puzzle"]);
  });

  it("orders the must-haves as listed, whatever order the database returned", () => {
    const [first, second] = MUST_HAVE_APP_IDS;
    const rows = parseHomeRows({ mustHave: [row(second), row("not-a-must-have"), row(first)] });
    expect(rows.mustHave.map((app) => app.id)).toEqual([first, second]);
  });

  it("gives an empty row for a missing or malformed listing, never a throw", () => {
    for (const body of [{}, null, "nope", { "trending:game": "not an array" }]) {
      const rows = parseHomeRows(body);
      expect(rows.trendingGames).toEqual([]);
      expect(rows.mustHave).toEqual([]);
    }
  });
});

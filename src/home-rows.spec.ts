import { describe, expect, it } from "vitest";
import { APP_CATEGORY_GROUPS } from "./categories";
import {
  HOME_LISTINGS,
  HOME_ROW_SIZE,
  HOME_ROWS,
  homeRowsOf,
  interleave,
  mixedCategoryRows,
  MUST_HAVE,
  parseHomeRows,
} from "./home-rows";

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
    expect(rows["trending:app"]).toHaveLength(HOME_ROW_SIZE);
    expect(rows["trending:app"]?.[0]).toMatchObject({
      id: "app-0",
      shortDescription: "About app-0",
      sources: ["flatpak-flathub"],
    });
    expect(rows["categoryPreview:Puzzle"]?.map((app) => app.id)).toEqual(["puzzle"]);
  });

  it("keeps the must-haves in the order catalog published them", () => {
    const rows = parseHomeRows({ [MUST_HAVE]: [row("vlc"), row("firefox"), row("gimp")] });
    expect(rows[MUST_HAVE]?.map((app) => app.id)).toEqual(["vlc", "firefox", "gimp"]);
  });

  it("gives an empty row for a missing or malformed listing, never a throw", () => {
    for (const body of [{}, null, "nope", { "trending:game": "not an array" }]) {
      const rows = parseHomeRows(body);
      expect(rows["trending:game"]).toEqual([]);
      expect(rows[MUST_HAVE]).toEqual([]);
    }
  });
});

describe("HOME_ROWS", () => {
  it("reads each precomputed listing once, the must-haves among them", () => {
    expect(new Set(HOME_LISTINGS).size).toBe(HOME_LISTINGS.length);
    expect(HOME_LISTINGS).toContain(MUST_HAVE);
    expect(HOME_LISTINGS).toContain("categoryPreview:Racing");
  });

  it("lists the app category rows in /categories' group order", () => {
    const order = APP_CATEGORY_GROUPS.flatMap((group) => group.categories);
    const positions = HOME_ROWS.filter(
      (candidate) => candidate.section === "apps" && candidate.category !== undefined,
    ).map((candidate) => order.indexOf(candidate.category ?? ""));
    expect(positions).not.toContain(-1);
    expect(positions).toEqual(positions.toSorted((a, b) => a - b));
  });

  it("links every category row to its listing", () => {
    for (const candidate of HOME_ROWS.filter(({ category }) => category !== undefined)) {
      expect(candidate.href).toBe(
        `/browse/?category=${encodeURIComponent(candidate.category ?? "")}`,
      );
    }
  });
});

describe("homeRowsOf", () => {
  it("leaves out a category row whose category the catalog doesn't list, keeps the others", () => {
    const titles = homeRowsOf("games", new Set(["Racing"])).map(({ title }) => title);
    expect(titles).toContain("Racing games");
    expect(titles).toContain("Trending games");
    expect(titles).not.toContain("Puzzle games");
    expect(titles).not.toContain("Trending apps");
  });
});

describe("interleave", () => {
  it("takes from each list in turn, the longer one's rest at the end", () => {
    expect(interleave(["1", "2", "3"], ["a"])).toEqual(["1", "a", "2", "3"]);
    expect(interleave([], ["a", "b"])).toEqual(["a", "b"]);
  });
});

describe("mixedCategoryRows", () => {
  it("alternates app categories and game genres, only the ones the catalog lists", () => {
    const rows = mixedCategoryRows(new Set(["Web Browsers", "Racing", "Photo & Video"]));
    expect(rows.map(({ title }) => title)).toEqual([
      "Web browsers",
      "Racing games",
      "Photo & video apps",
    ]);
  });
});

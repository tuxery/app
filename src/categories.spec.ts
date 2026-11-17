import { describe, expect, it } from "vitest";
import {
  APP_CATEGORY_GROUPS,
  categoryDirectory,
  categoryTrail,
  groupCategories,
  retiredCategoryRedirect,
} from "./categories";

const counts = (...categories: string[]) => categories.map((category) => ({ category, count: 1 }));

describe("groupCategories", () => {
  it("sorts categories into their groups, in each group's own order, empty groups left out", () => {
    const grouped = groupCategories(
      counts("Networking", "Web Browsers", "Developer Tools"),
      APP_CATEGORY_GROUPS,
    );
    expect(grouped.map(({ group }) => group.id)).toEqual(["internet", "system"]);
    expect(grouped[0]?.items.map((item) => item.category)).toEqual(["Web Browsers", "Networking"]);
  });

  it("keeps a category no group names in a trailing Other group, and drops To Classify", () => {
    const grouped = groupCategories(
      counts("Email", "Brand New", "To Classify"),
      APP_CATEGORY_GROUPS,
    );
    expect(grouped.at(-1)).toMatchObject({
      group: { id: "other" },
      items: [{ category: "Brand New" }],
    });
    expect(grouped.flatMap(({ items }) => items).map((item) => item.category)).not.toContain(
      "To Classify",
    );
  });

  it("drops a retired id an older catalog still lists", () => {
    const grouped = groupCategories(
      counts("Internet & Communication", "Email"),
      APP_CATEGORY_GROUPS,
    );
    expect(grouped.map(({ group }) => group.id)).toEqual(["internet"]);
  });

  it("names every category at most once", () => {
    const all = APP_CATEGORY_GROUPS.flatMap((group) => group.categories);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("categoryDirectory", () => {
  it("lists the app groups, then the game genres as a last group", () => {
    const directory = categoryDirectory(
      counts("Productivity", "Web Browsers", "To Classify"),
      counts("Racing", "Puzzle", "To Classify"),
    );
    expect(directory.map(({ group }) => group.id)).toEqual(["internet", "work", "games"]);
    expect(directory.at(-1)?.items.map((item) => item.category)).toEqual(["Racing", "Puzzle"]);
  });

  it("has no games group when no genre is listed", () => {
    expect(
      categoryDirectory(counts("Email"), counts("To Classify")).map(({ group }) => group.id),
    ).toEqual(["internet"]);
  });
});

describe("retiredCategoryRedirect", () => {
  it("sends a split category's links to the group listing its parts", () => {
    expect(retiredCategoryRedirect("Internet & Communication")).toBe("/categories/#internet");
  });

  it("leaves current categories and other filters alone", () => {
    expect(retiredCategoryRedirect("Email")).toBeUndefined();
    expect(retiredCategoryRedirect(null)).toBeUndefined();
    expect(retiredCategoryRedirect("hasOwnProperty")).toBeUndefined();
  });
});

describe("categoryTrail", () => {
  it("leads from the type's listing to the category's", () => {
    expect(categoryTrail(undefined, "Graphics & Design")).toEqual([
      { label: "Apps", href: "/browse/?type=app" },
      {
        label: "Graphics & Design",
        href: "/browse/?category=Graphics%20%26%20Design",
        category: "Graphics & Design",
      },
    ]);
    expect(categoryTrail("game", "Puzzle")[0]).toEqual({
      label: "Games",
      href: "/browse/?type=game",
    });
  });

  it("stops at the type for To Classify, which isn't a category", () => {
    expect(categoryTrail(undefined, "To Classify")).toEqual([
      { label: "Apps", href: "/browse/?type=app" },
    ]);
  });
});

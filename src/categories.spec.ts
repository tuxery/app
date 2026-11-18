import { describe, expect, it } from "vitest";
import {
  APP_CATEGORY_GROUPS,
  categoryDirectory,
  categoryPageHref,
  categorySlug,
  categoryTrail,
  labelForSlug,
  orderSubcategories,
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

  it("lists AI in a group of its own", () => {
    const grouped = groupCategories(counts("AI", "Productivity"), APP_CATEGORY_GROUPS);
    expect(grouped.map(({ group }) => group.id)).toEqual(["work", "ai"]);
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

  it("sends a renamed category's links to its new name", () => {
    expect(retiredCategoryRedirect("Settings")).toBe("/browse/?category=Desktop%20%26%20Settings");
  });

  it("leaves current categories and other filters alone", () => {
    expect(retiredCategoryRedirect("Email")).toBeUndefined();
    expect(retiredCategoryRedirect(null)).toBeUndefined();
    expect(retiredCategoryRedirect("hasOwnProperty")).toBeUndefined();
  });
});

describe("orderSubcategories", () => {
  it("lists the drawers of packages people rarely browse for last", () => {
    const subs = ["Language Modules & Cross-Compilers", "Version Control", "Databases"].map(
      (subcategory) => ({ subcategory }),
    );
    expect(orderSubcategories(subs).map((s) => s.subcategory)).toEqual([
      "Version Control",
      "Databases",
      "Language Modules & Cross-Compilers",
    ]);
  });
});

describe("categoryTrail", () => {
  it("leads from /apps or /games to the category's page", () => {
    expect(categoryTrail(undefined, "Graphics & Design")).toEqual([
      { label: "Apps", href: "/apps/" },
      {
        label: "Graphics & Design",
        href: "/categories/graphics-and-design/",
        category: "Graphics & Design",
      },
    ]);
    expect(categoryTrail("game", "Puzzle")[0]).toEqual({ label: "Games", href: "/games/" });
  });

  it("ends at the subcategory's page when the product has one", () => {
    expect(categoryTrail(undefined, "Developer Tools", "Version Control")[2]).toEqual({
      label: "Version Control",
      href: "/categories/developer-tools/version-control/",
    });
  });

  it("stops at the type for To Classify, which isn't a category", () => {
    expect(categoryTrail(undefined, "To Classify")).toEqual([{ label: "Apps", href: "/apps/" }]);
  });
});

describe("categorySlug", () => {
  it('lowercases, spells out "&" and joins words with hyphens', () => {
    expect(categorySlug("Graphics & Design")).toBe("graphics-and-design");
    expect(categorySlug("3D Modeling & Rendering")).toBe("3d-modeling-and-rendering");
    expect(categorySlug("Clipboard, Screenshots & Desktop Helpers")).toBe(
      "clipboard-screenshots-and-desktop-helpers",
    );
    expect(categorySlug("Role-Playing")).toBe("role-playing");
    expect(categorySlug("AI")).toBe("ai");
  });
});

describe("categoryPageHref", () => {
  it("names a category's page and a subcategory's under it", () => {
    expect(categoryPageHref("Web Browsers")).toBe("/categories/web-browsers/");
    expect(categoryPageHref("Puzzle", "Word & Trivia")).toBe("/categories/puzzle/word-and-trivia/");
  });

  it("keeps To Classify a /browse filter, since it has no page", () => {
    expect(categoryPageHref("To Classify")).toBe("/browse/?category=To%20Classify");
  });
});

describe("labelForSlug", () => {
  it("finds the label a slug was made from", () => {
    const labels = ["Web Browsers", "Graphics & Design"];
    expect(labelForSlug(labels, "graphics-and-design")).toBe("Graphics & Design");
    expect(labelForSlug(labels, "graphics")).toBeUndefined();
  });
});

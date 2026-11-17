/**
 * How the site presents catalog's categories: the groups the /categories
 * page sorts app categories into, and what becomes of a category id that
 * catalog no longer publishes. The categories themselves (their labels,
 * which are also their ids in `/browse/?category=`) are catalog's
 * (`tuxery/catalog`'s `docs/categories.md`); this file only arranges them,
 * and copes with one it doesn't know — a newer catalog can add a category
 * before this list names it.
 */

export interface CategoryGroup {
  /** Anchor on /categories (`/categories/#internet`). */
  id: string;
  title: string;
  categories: readonly string[];
}

/** App categories by what people go looking for, in display order. */
export const APP_CATEGORY_GROUPS: readonly CategoryGroup[] = [
  {
    id: "internet",
    title: "Internet & communication",
    categories: [
      "Web Browsers",
      "Messaging & Calls",
      "Email",
      "Social Media",
      "File Sharing & Downloads",
      "Networking",
    ],
  },
  {
    id: "create",
    title: "Create",
    categories: ["Graphics & Design", "Photo & Video", "Music & Audio"],
  },
  { id: "work", title: "Work", categories: ["Productivity", "Business", "Finance"] },
  { id: "ai", title: "Artificial intelligence", categories: ["AI"] },
  {
    id: "learn",
    title: "Learn & discover",
    categories: [
      "Education",
      "Science",
      "Books & Reference",
      "News & Weather",
      "Travel & Navigation",
    ],
  },
  {
    id: "system",
    title: "System & development",
    categories: ["Developer Tools", "System Tools", "Security", "Settings", "Utilities"],
  },
  { id: "gaming", title: "Around games", categories: ["Gaming Tools"] },
];

/** Not a category: everything nothing classified yet. Listed apart, never in a group or grid. */
export const TO_CLASSIFY = "To Classify";

/**
 * `items` (anything with a `category`) sorted into `groups`, each group in
 * its own listed order, empty groups left out; whatever no group names
 * (a category newer than this file) lands in a trailing "Other" group so
 * it is never hidden. "To Classify" and retired ids (a catalog published
 * before their split still lists them; their link only leads back to
 * /categories) are left out entirely.
 */
export function groupCategories<T extends { category: string }>(
  items: readonly T[],
  groups: readonly CategoryGroup[],
): { group: CategoryGroup; items: T[] }[] {
  const byCategory = new Map(items.map((item) => [item.category, item]));
  const grouped = new Set(groups.flatMap((group) => group.categories));
  const result = groups
    .map((group) => ({
      group,
      items: group.categories.flatMap((category) => byCategory.get(category) ?? []),
    }))
    .filter(({ items: listed }) => listed.length > 0);
  const others = items.filter(
    (item) => !grouped.has(item.category) && isBrowsableCategory(item.category),
  );
  if (others.length > 0) {
    result.push({ group: { id: "other", title: "Other", categories: [] }, items: others });
  }
  return result;
}

/**
 * Category ids catalog used to publish, and where a link to one now goes.
 * A category that was split has no single successor: its link opens the
 * /categories group that lists the parts. Testers' bookmarks and shared
 * links still land somewhere useful instead of an empty listing.
 */
const RETIRED_CATEGORIES: Readonly<Record<string, string>> = {
  "Internet & Communication": "/categories/#internet",
};

/** A category a grid or chip can link to: neither "To Classify" nor a retired id. */
export function isBrowsableCategory(category: string): boolean {
  return category !== TO_CLASSIFY && !Object.hasOwn(RETIRED_CATEGORIES, category);
}

/**
 * Every category to browse, as the homepage lists them: the app groups of
 * /categories, then the game genres as one last "Games" group (in
 * `gameCategories`' order, largest first). Same rules as
 * `groupCategories`: nothing to classify, no retired id, no empty group.
 */
export function categoryDirectory<T extends { category: string }>(
  appCategories: readonly T[],
  gameCategories: readonly T[],
): { group: CategoryGroup; items: T[] }[] {
  const games = gameCategories.filter(({ category }) => isBrowsableCategory(category));
  return [
    ...groupCategories(appCategories, APP_CATEGORY_GROUPS),
    ...(games.length > 0
      ? [
          {
            group: { id: "games", title: "Games", categories: games.map((g) => g.category) },
            items: games,
          },
        ]
      : []),
  ];
}

/** Where a `/browse/` link filtering on `category` should go instead, when that id is retired. */
export function retiredCategoryRedirect(category: string | null): string | undefined {
  if (category === null || !Object.hasOwn(RETIRED_CATEGORIES, category)) return undefined;
  return RETIRED_CATEGORIES[category];
}

/**
 * The trail above a product page's name: the type's listing, then its
 * category's, each a /browse filter. No category step for "To Classify",
 * which isn't one.
 */
export function categoryTrail(
  contentType: "game" | undefined,
  category: string | undefined,
): { label: string; href: string; category?: string }[] {
  const root =
    contentType === "game"
      ? { label: "Games", href: "/browse/?type=game" }
      : { label: "Apps", href: "/browse/?type=app" };
  if (!category || category === TO_CLASSIFY) return [root];
  return [
    root,
    { label: category, href: `/browse/?category=${encodeURIComponent(category)}`, category },
  ];
}

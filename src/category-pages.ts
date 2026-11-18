import {
  getCategories,
  getSubcategories,
  getSubcategoryTops,
  type CategoryCount,
  type SubcategoryCount,
} from "~/catalog";
import type { AppSummary } from "~/catalog-types";
import { isBrowsableCategory, labelForSlug, orderSubcategories } from "~/categories";
import type { SubcategoryEntry } from "~/components/category-page/category-page";
import type { ServerEnv } from "~/server-env";

/** How many of a subcategory's first products are read, to show three with an icon. */
const PREVIEW_READ = 8;

/** The category a page's slug names, among the ones the published catalog lists. */
export function resolveCategory(
  categories: readonly CategoryCount[],
  slug: string,
): CategoryCount | undefined {
  const label = labelForSlug(
    categories.map(({ category }) => category).filter(isBrowsableCategory),
    slug,
  );
  return categories.find(({ category }) => category === label);
}

/** `apps` with an icon first, the others after, so a preview shows real icons. */
export function iconsFirst(apps: readonly AppSummary[]): AppSummary[] {
  return [...apps.filter((app) => app.iconUrl), ...apps.filter((app) => !app.iconUrl)];
}

/**
 * What a category's and its subcategories' pages share: the category,
 * whether it's a game genre, and its subcategories (catalog's order, the
 * rarely browsed ones last). Three cached `meta` reads.
 */
export async function categoryContext(env: ServerEnv, slug: string) {
  const [all, games, subcategories] = await Promise.all([
    getCategories(env, "all"),
    getCategories(env, "game"),
    getSubcategories(env, "all"),
  ]);
  const found = resolveCategory(all, slug);
  if (!found) return undefined;
  return {
    category: found.category,
    count: found.count,
    isGame: games.some(({ category }) => category === found.category),
    subcategories: orderSubcategories(
      subcategories.filter(({ category }) => category === found.category),
    ),
  };
}

/** `subcategories` with their first products (icons first), read together in two queries. */
export async function withPreviews(
  env: ServerEnv,
  category: string,
  subcategories: readonly SubcategoryCount[],
): Promise<SubcategoryEntry[]> {
  const tops = await getSubcategoryTops(
    env,
    category,
    subcategories.map(({ subcategory }) => subcategory),
    PREVIEW_READ,
  );
  return subcategories.map(({ subcategory, count }) => ({
    subcategory,
    count,
    apps: iconsFirst(tops[subcategory] ?? []),
  }));
}

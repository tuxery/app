// The `page` of a /browse URL, and the page index and filters `browseApps`
// is asked for. All come from the visitor (the query string, the infinite
// scroll's `server$` call, which sends its arguments as it likes), so none
// is trusted to be what its type says.

import type { BrowseOptions } from "~/catalog";
import { isInstallSource } from "~/catalog-types";

/** Pages past this one are answered as the first: no listing is that long, and an `OFFSET` costs a read per skipped row. */
export const MAX_PAGE_INDEX = 4999;

/** A zero-based page index that is safe to turn into an `OFFSET`; anything else (NaN, a fraction, a negative, a string) is the first page. */
export function toPageIndex(value: unknown): number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_PAGE_INDEX
    ? value
    : 0;
}

/** The zero-based page index of a `?page=` value (1-based in the URL); the first page when absent or not a page number. */
export function parsePageParam(value: string | null): number {
  if (value === null || !/^\d{1,6}$/.test(value)) return 0;
  return toPageIndex(Number(value) - 1);
}

/** No category label is anywhere near this long; a longer one is no category. */
const MAX_CATEGORY_LENGTH = 100;

/**
 * `browseApps`' filters, each either one of the values it knows or its
 * default — whatever was passed, an object or not. These end up in SQL
 * conditions and in the listing cache's key: a `source` that is not a real
 * source would be a `LIKE` pattern of the visitor's choosing over every
 * app, and a free-form `sort` or `interfaceFilter` as many cache entries as
 * there are strings. `category` stays free text (the list lives in the
 * database), bounded in length: an unknown one matches no row.
 */
export function normalizeBrowseOptions(
  options: unknown,
): Required<Pick<BrowseOptions, "interfaceFilter" | "typeFilter" | "sort">> &
  Pick<BrowseOptions, "category" | "source" | "license"> {
  const given = (typeof options === "object" && options !== null ? options : {}) as Record<
    string,
    unknown
  >;
  const { interfaceFilter, typeFilter, category, source, license, sort } = given;
  return {
    interfaceFilter:
      interfaceFilter === "gui" || interfaceFilter === "cli" ? interfaceFilter : "all",
    typeFilter: typeFilter === "game" || typeFilter === "app" ? typeFilter : "all",
    category:
      typeof category === "string" && category !== "" && category.length <= MAX_CATEGORY_LENGTH
        ? category
        : undefined,
    source: typeof source === "string" && isInstallSource(source) ? source : undefined,
    license: license === "free" ? "free" : undefined,
    sort: sort === "name-asc" || sort === "name-desc" ? sort : "relevance",
  };
}

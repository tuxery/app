import { describe, expect, it } from "vitest";
import contract from "./store-contract.json";
import {
  ageCountKey,
  ageIdsChunkKey,
  BROWSE_KEYS_META_KEY,
  categoryIdsChunkKey,
  countKey,
  freeCountKey,
  parseBrowseKeys,
  sourceIdsChunkKey,
  type BrowseKeys,
} from "~/browse-keys";
import {
  AGE_BRACKET_COLUMN,
  CATEGORY_PREVIEW_SIZE,
  listingRowsKey,
  SUMMARY_COLUMNS,
  TRENDING_PAGE_SIZE,
} from "~/catalog";
import { AGE_BRACKETS, AGE_FILTERS } from "~/catalog-types";
import { FAMILY_GAMES, HOME_LISTINGS, MUST_HAVE } from "~/home-rows";

// Pins what this repo reads from catalog's Turso rows to store-contract.json,
// the file catalog's publish() is pinned to on its side (CI keeps the two
// copies equal). Each key function is called with the format's own
// `{placeholder}`s, so it must rebuild the format exactly.

const formats = contract.metaKeyFormats;

// A typecheck error when `BrowseKeys` gains or loses a field, so the list
// compared with the contract below can't fall behind the interface.
const BROWSE_KEYS_FIELDS = {
  generation: true,
  sourceIdsChunkSize: true,
  freeCounts: true,
  categoryIds: true,
  ageFilter: true,
} satisfies Record<keyof BrowseKeys, true>;

describe("store contract (store-contract.json)", () => {
  it("selects the summary columns", () => {
    expect(SUMMARY_COLUMNS.split(", ")).toEqual(contract.summaryColumns);
  });

  it("caps listings at the sizes catalog precomputes", () => {
    expect(TRENDING_PAGE_SIZE).toBe(contract.listingSizes.trending);
    expect(CATEGORY_PREVIEW_SIZE).toBe(contract.listingSizes.categoryPreview);
  });

  it("reads the homepage's must-haves from the contract's listing", () => {
    expect(MUST_HAVE).toBe(contract.mustHaveListing);
    expect(HOME_LISTINGS).toContain(contract.mustHaveListing);
  });

  it("reads the homepage's all-ages games from the contract's listing", () => {
    expect(FAMILY_GAMES).toBe(contract.familyGamesListing);
    expect(HOME_LISTINGS).toContain(contract.familyGamesListing);
  });

  it("reads the browseKeys row under its key, with the contract's fields", () => {
    expect(BROWSE_KEYS_META_KEY).toBe(contract.browseKeys.metaKey);
    expect(Object.keys(BROWSE_KEYS_FIELDS).toSorted()).toEqual(
      contract.browseKeys.fields.toSorted(),
    );
    const value = {
      generation: "1",
      sourceIdsChunkSize: 500,
      freeCounts: true,
      categoryIds: true,
      ageFilter: true,
    };
    expect(parseBrowseKeys(JSON.stringify(value))).toEqual(value);
  });

  it("builds every meta key in the contract's formats", () => {
    // The filter unions only admit their own values: the placeholders stand in for them.
    const [iface, type] = ["{interface}", "{type}"] as never[];
    expect(countKey("{generation}", iface, type, "{source}", "{category}")).toBe(formats.count);
    expect(freeCountKey("{generation}", iface, type, "{source}", "{category}")).toBe(
      formats.countFree,
    );
    expect(sourceIdsChunkKey("{generation}", "{source}", "{chunk}" as never)).toBe(
      formats.sourceIds,
    );
    expect(categoryIdsChunkKey("{generation}", "{chunk}" as never, "{category}")).toBe(
      formats.categoryIds,
    );
    expect(listingRowsKey("{listing}")).toBe(formats.listingRows);
    expect(
      ageCountKey(
        "{generation}",
        "{age}" as never,
        "{license}" as never,
        iface,
        type,
        "{source}",
        "{category}",
      ),
    ).toBe(formats.countAge);
    expect(ageIdsChunkKey("{generation}", "{age}" as never, type, "{chunk}" as never)).toBe(
      formats.ageIds,
    );
  });

  it("filters by the contract's age brackets, on its column", () => {
    expect([...AGE_BRACKETS]).toEqual(contract.ageBrackets.values);
    expect([...AGE_FILTERS]).toEqual(contract.ageBrackets.filters);
    expect(AGE_BRACKET_COLUMN).toBe(contract.ageBrackets.column);
  });

  it("writes an unset license in an age count as the contract's unset filter", () => {
    expect(ageCountKey("g", 7, undefined, "all", "all", undefined, undefined)).toBe(
      `countAge:g:7:${contract.unsetFilter}:all:all:${contract.unsetFilter}:${contract.unsetFilter}`,
    );
  });

  it("writes an unset source or category as the contract's unset filter", () => {
    const unset = contract.unsetFilter;
    const expected = formats.count
      .replace("{generation}", "g")
      .replace("{interface}", "all")
      .replace("{type}", "all")
      .replace("{source}", unset)
      .replace("{category}", unset);
    expect(countKey("g", "all", "all", undefined, undefined)).toBe(expected);
  });
});

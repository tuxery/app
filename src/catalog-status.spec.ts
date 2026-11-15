import { describe, expect, it } from "vitest";
import {
  CATALOG_UNAVAILABLE_KEY,
  isCatalogUnavailable,
  markRequestStart,
  needsCatalog,
  noteQueryFailure,
  queryFailedDuringRequest,
  queryFailedSince,
} from "~/catalog-status";

describe("catalog status", () => {
  it("reads the layout's verdict from the shared map", () => {
    expect(isCatalogUnavailable(new Map())).toBe(false);
    expect(isCatalogUnavailable(new Map([[CATALOG_UNAVAILABLE_KEY, true]]))).toBe(true);
  });

  it("knows which pages render without the catalog", () => {
    expect(needsCatalog("/")).toBe(true);
    expect(needsCatalog("/app/firefox/")).toBe(true);
    expect(needsCatalog("/browse/")).toBe(true);
    expect(needsCatalog("/docs/glossary/")).toBe(false);
    expect(needsCatalog("/docs")).toBe(false);
    expect(needsCatalog("/settings")).toBe(false);
  });
});

describe("query failures", () => {
  it("are seen by a request that started before or as they happened, not by a later one", () => {
    noteQueryFailure(1_000);
    expect(queryFailedSince(900)).toBe(true);
    expect(queryFailedSince(1_000)).toBe(true);
    expect(queryFailedSince(1_001)).toBe(false);
  });

  it("are read against the request's own start", () => {
    const sharedMap = new Map<string, unknown>();
    expect(queryFailedDuringRequest(sharedMap)).toBe(false);
    markRequestStart(sharedMap, 2_000);
    expect(queryFailedDuringRequest(sharedMap)).toBe(false);
    noteQueryFailure(2_500);
    expect(queryFailedDuringRequest(sharedMap)).toBe(true);
    const later = new Map<string, unknown>();
    markRequestStart(later, 3_000);
    expect(queryFailedDuringRequest(later)).toBe(false);
  });
});

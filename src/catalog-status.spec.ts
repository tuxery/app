import { describe, expect, it } from "vitest";
import { CATALOG_UNAVAILABLE_KEY, isCatalogUnavailable, needsCatalog } from "~/catalog-status";

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

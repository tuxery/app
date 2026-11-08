import { describe, expect, it } from "vitest";
import { brandBorderAttributes, brandBorders } from "./brand-colors";

describe("brandBorders", () => {
  it("keeps any plain #rrggbb, lowercased, whatever its contrast with the theme", () => {
    expect(brandBorders({ light: "#BFDBFE", dark: "#1E3A8A" })).toEqual({
      light: "#bfdbfe",
      dark: "#1e3a8a",
    });
    expect(brandBorders({ light: "#000000", dark: "#ffffff" })).toEqual({
      light: "#000000",
      dark: "#ffffff",
    });
  });

  it("refuses anything else: it ends up in a style attribute", () => {
    for (const value of [
      "red",
      "#abc",
      "#12345",
      "#1234567",
      "#123456;background:url(//evil)",
      "url(javascript:alert(1))",
      " #123456",
      "",
      undefined,
      42,
      null,
    ]) {
      expect(brandBorders({ light: value })).toEqual({});
    }
  });

  it("drops a missing scheme, and never throws", () => {
    expect(brandBorders({ dark: "#1e3a8a" })).toEqual({ dark: "#1e3a8a" });
    expect(brandBorders(undefined)).toEqual({});
    expect(brandBorders(null)).toEqual({});
    expect(brandBorders("#ffffff")).toEqual({});
  });
});

describe("brandBorderAttributes", () => {
  it("builds the style and classes for the schemes kept", () => {
    expect(brandBorderAttributes({ light: "#bfdbfe", dark: "#1e3a8a" })).toEqual({
      style: "--brand-light:#bfdbfe;--brand-dark:#1e3a8a",
      classes: "brand-border-light brand-border-dark",
    });
    expect(brandBorderAttributes({ dark: "#1e3a8a" })).toEqual({
      style: "--brand-dark:#1e3a8a",
      classes: "brand-border-dark",
    });
  });

  it("is empty without a border", () => {
    expect(brandBorderAttributes({})).toEqual({ style: undefined, classes: "" });
  });
});

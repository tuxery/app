import { describe, expect, it } from "vitest";
import {
  brandTintAttributes,
  brandTints,
  contrastRatio,
  MIN_CONTRAST,
  parseHex,
  THEME_COLORS,
  tintedBackground,
  type Scheme,
} from "./brand-colors";

describe("parseHex", () => {
  it("reads a plain #rrggbb, either case", () => {
    expect(parseHex("#1E3A8A")).toEqual([30, 58, 138]);
    expect(parseHex("#bfdbfe")).toEqual([191, 219, 254]);
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
      expect(parseHex(value)).toBeUndefined();
    }
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for a color on itself", () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(contrastRatio([10, 20, 30], [10, 20, 30])).toBe(1);
  });
});

describe("brandTints", () => {
  it("keeps the colors of Flathub's own examples: pastel for light, deep for dark", () => {
    expect(brandTints({ light: "#BFDBFE", dark: "#1E3A8A" })).toEqual({
      light: "#bfdbfe",
      dark: "#1e3a8a",
    });
  });

  it("drops a scheme whose tint would make the text or the links hard to read", () => {
    // A bright color tints the dark theme's background towards the light text.
    expect(brandTints({ light: "#bfdbfe", dark: "#ffffff" })).toEqual({ light: "#bfdbfe" });
    // Pure black darkens the light theme's background towards the dark text.
    expect(brandTints({ light: "#000000", dark: "#1e3a8a" })).toEqual({ dark: "#1e3a8a" });
  });

  it("drops invalid values and a missing scheme, and never throws", () => {
    expect(brandTints({ light: "red", dark: "#123456;x" })).toEqual({});
    expect(brandTints({ dark: "#1e3a8a" })).toEqual({ dark: "#1e3a8a" });
    expect(brandTints(undefined)).toEqual({});
    expect(brandTints("#ffffff")).toEqual({});
  });

  it("keeps every tint it returns above WCAG AA for the text and the links, whatever the color", () => {
    let kept = 0;
    for (let index = 0; index < 2000; index += 1) {
      const color = `#${((index * 8_388_617) % 16_777_216).toString(16).padStart(6, "0")}`;
      const tints = brandTints({ light: color, dark: color });
      for (const scheme of Object.keys(tints) as Scheme[]) {
        kept += 1;
        const background = tintedBackground(parseHex(color) as [number, number, number], scheme);
        for (const foreground of [THEME_COLORS[scheme].text, THEME_COLORS[scheme].link]) {
          expect(
            contrastRatio(parseHex(foreground) as [number, number, number], background),
          ).toBeGreaterThanOrEqual(MIN_CONTRAST);
        }
      }
    }
    // The check is not vacuous: plenty are kept, and plenty are dropped.
    expect(kept).toBeGreaterThan(500);
    expect(kept).toBeLessThan(4000);
  });
});

describe("brandTintAttributes", () => {
  it("builds the style and classes for the schemes kept", () => {
    expect(brandTintAttributes({ light: "#bfdbfe", dark: "#1e3a8a" })).toEqual({
      style: "--brand-light:#bfdbfe;--brand-dark:#1e3a8a",
      classes: "p-5 brand-tint-light brand-tint-dark",
    });
    expect(brandTintAttributes({ dark: "#1e3a8a" })).toEqual({
      style: "--brand-dark:#1e3a8a",
      classes: "p-5 brand-tint-dark",
    });
  });

  it("is empty without a tint", () => {
    expect(brandTintAttributes({})).toEqual({ style: undefined, classes: "" });
  });
});

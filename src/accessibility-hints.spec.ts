import { describe, expect, it } from "vitest";
import { accessibilityHints } from "./accessibility-hints";

describe("accessibilityHints", () => {
  it("words the display and accessibility kudos, in a fixed order", () => {
    expect(accessibilityHints(["HiDpiIcon", "HighContrast"])).toEqual([
      "High-contrast mode",
      "Sharp icon on high-resolution screens",
    ]);
  });

  it("leaves out the kudos about how the app is built", () => {
    expect(accessibilityHints(["ModernToolkit", "UserDocs", "Notifications"])).toEqual([]);
  });

  it("is empty without kudos", () => {
    expect(accessibilityHints(undefined)).toEqual([]);
    expect(accessibilityHints([])).toEqual([]);
  });
});

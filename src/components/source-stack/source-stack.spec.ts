import { describe, expect, it } from "vitest";
import { recommendedGroup } from "./source-stack";

describe("recommendedGroup", () => {
  const ubuntu = new Set(["Ubuntu", "Flatpak", "Snap"]);
  it("prefers the selected OS's own packages", () => {
    expect(recommendedGroup(["Flatpak", "Snap", "Ubuntu"], "Ubuntu", ubuntu)).toBe("Ubuntu");
  });
  it("falls back to Flatpak, which works everywhere", () => {
    expect(recommendedGroup(["Snap", "Flatpak", "Fedora"], "Ubuntu", ubuntu)).toBe("Flatpak");
    expect(recommendedGroup(["Snap", "Flatpak"], undefined, undefined)).toBe("Flatpak");
  });
  it("then to a group the OS uses, then to the first one", () => {
    expect(recommendedGroup(["Fedora", "Snap"], "Ubuntu", ubuntu)).toBe("Snap");
    expect(recommendedGroup(["Fedora", "Debian"], undefined, undefined)).toBe("Fedora");
    expect(recommendedGroup([], undefined, undefined)).toBeUndefined();
  });
});

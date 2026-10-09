import { describe, expect, it } from "vitest";
import { autoActivatedNote, autoShownNote } from "~/settings-auto";

describe("autoShownNote", () => {
  it("shows everything when no OS is picked", () => {
    expect(autoShownNote("Snap", undefined, undefined)).toBe("Auto: shown");
  });

  it("follows the picked OS's recommendation", () => {
    const recommended = new Set(["Ubuntu", "Snap"]);
    expect(autoShownNote("Snap", recommended, "Ubuntu")).toBe("Auto: shown — used on Ubuntu");
    expect(autoShownNote("Fedora", recommended, "Ubuntu")).toBe(
      "Auto: hidden — not used on Ubuntu",
    );
  });
});

describe("autoActivatedNote", () => {
  it("assumes nothing is set up when no OS is picked", () => {
    expect(autoActivatedNote("flathub", undefined, undefined)).toBe("Auto: not set up yet");
  });

  it("counts what the picked OS ships with as done", () => {
    const preActivated = new Set(["snap-store"]);
    expect(autoActivatedNote("snap-store", preActivated, "Ubuntu")).toBe(
      "Auto: done — Ubuntu comes with it",
    );
    expect(autoActivatedNote("flathub", preActivated, "Ubuntu")).toBe(
      "Auto: not set up — Ubuntu doesn't include it",
    );
  });
});

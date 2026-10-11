import { describe, expect, it } from "vitest";
import { buildCount, releaseLinesTip } from "./build-indicator";

describe("buildCount and releaseLinesTip", () => {
  const firefox = {
    editions: [
      { name: "Standard", versions: ["Stable", "Beta", "Nightly"] },
      { name: "ESR", versions: ["Stable"] },
    ],
    otherBuilds: ["Bin"],
  };
  it("counts every edition's versions plus the other builds", () => {
    expect(buildCount(firefox)).toBe(5);
    expect(
      buildCount({ editions: [{ name: "Standard", versions: ["Stable"] }], otherBuilds: [] }),
    ).toBe(1);
  });
  it("spells out one edition per line, then the other builds", () => {
    expect(releaseLinesTip(firefox)).toBe(
      "Standard: Stable, Beta, Nightly\nESR: Stable\nOther builds: Bin",
    );
  });
});

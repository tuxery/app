import { describe, expect, it } from "vitest";
import { buildCount, releaseLinesTip } from "./build-count";

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
  it("spells out one edition and version per line, then the other builds", () => {
    expect(releaseLinesTip(firefox)).toBe(
      "Standard: Stable\nStandard: Beta\nStandard: Nightly\nESR: Stable\nOther builds: Bin",
    );
  });
});

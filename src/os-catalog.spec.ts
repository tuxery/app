import { describe, expect, it } from "vitest";
import { OS_CATALOG, OS_FAMILIES } from "~/os-catalog";
import { OS_LOGOS } from "~/data/logos";

describe("OS_FAMILIES", () => {
  it("puts every OS in exactly one family, and only known ones", () => {
    const grouped = OS_FAMILIES.flatMap((family) => family.osIds);
    expect(grouped.toSorted()).toEqual(OS_CATALOG.map((entry) => entry.id).toSorted());
  });
});

describe("OS_LOGOS", () => {
  it("has a logo for every OS", () => {
    expect(OS_CATALOG.filter((entry) => !OS_LOGOS[entry.id]).map((entry) => entry.id)).toEqual([]);
  });
});

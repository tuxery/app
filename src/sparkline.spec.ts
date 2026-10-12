import { describe, expect, it } from "vitest";
import { sparkline } from "~/sparkline";

const SIZE = { width: 100, height: 20 };

describe("sparkline", () => {
  it("scales from zero, oldest point on the left", () => {
    const result = sparkline([0, 5, 10], SIZE);
    expect(result?.line).toBe("1,19 50,10 99,1");
  });

  it("closes the area down to the baseline", () => {
    expect(sparkline([10, 10], SIZE)?.area).toBe("M1,19 L1,1 L99,1 L99,19 Z");
  });

  it("draws nothing without a series to read", () => {
    expect(sparkline(undefined, SIZE)).toBeUndefined();
    expect(sparkline([4], SIZE)).toBeUndefined();
    expect(sparkline([0, 0, 0], SIZE)).toBeUndefined();
  });

  it("treats a bad value as no installs that day instead of breaking the path", () => {
    const result = sparkline([2, Number.NaN, -3, 4], SIZE);
    expect(result?.line).not.toContain("NaN");
  });

  it("describes the series in words", () => {
    expect(sparkline([1000, 2000, 3000], SIZE)?.description).toBe(
      "Daily installs over the last 3 days: 6,000 in total, up to 3,000 a day",
    );
  });
});

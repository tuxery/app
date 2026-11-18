import { describe, expect, it } from "vitest";
import { dailyPick } from "./daily-pick";

const items = ["a", "b", "c", "d", "e"];
const day = (n: number, hour = 0) => new Date(Date.UTC(1970, 0, 1 + n, hour));

describe("dailyPick", () => {
  it("keeps the same pick all day, UTC", () => {
    expect(dailyPick(items, day(3, 0))).toEqual(dailyPick(items, day(3, 23)));
  });

  it("moves to the next item the next day and wraps around", () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => dailyPick(items, day(n))[0])).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "a",
    ]);
  });

  it("picks consecutive items, the next ones the next day", () => {
    expect(dailyPick(items, day(0), 3)).toEqual(["a", "b", "c"]);
    expect(dailyPick(items, day(1), 3)).toEqual(["d", "e", "a"]);
  });

  it("returns everything when asked for as many or more", () => {
    expect(dailyPick(items, day(7), 5)).toEqual(items);
    expect(dailyPick(items, day(7), 9)).toEqual(items);
  });

  it("returns nothing for an empty list or a zero count", () => {
    expect(dailyPick([], day(1))).toEqual([]);
    expect(dailyPick(items, day(1), 0)).toEqual([]);
  });

  it("copes with dates before 1970", () => {
    expect(dailyPick(items, day(-1))).toEqual(["e"]);
  });
});

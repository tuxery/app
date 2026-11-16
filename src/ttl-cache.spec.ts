import { describe, expect, it } from "vitest";
import { createTtlCache } from "./ttl-cache";

describe("createTtlCache", () => {
  it("returns a value until it expires, then forgets it", () => {
    const cache = createTtlCache<string>(10, 1000);
    cache.set("a", "one", 0);
    expect(cache.get("a", 999)).toEqual({ value: "one" });
    expect(cache.get("a", 1000)).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("tells a cached undefined from a miss", () => {
    const cache = createTtlCache<string | undefined>(10, 1000);
    cache.set("a", undefined, 0);
    expect(cache.get("a", 1)).toEqual({ value: undefined });
    expect(cache.get("b", 1)).toBeUndefined();
  });

  it("never holds more than its ceiling, whatever the keys", () => {
    const cache = createTtlCache<number>(100, 1000);
    for (let i = 0; i < 10_000; i++) cache.set(`browseApps:category-${i}`, i, 0);
    expect(cache.size).toBe(100);
    expect(cache.get("browseApps:category-9999", 1)).toEqual({ value: 9999 });
    expect(cache.get("browseApps:category-0", 1)).toBeUndefined();
  });

  it("drops the expired entries before any fresh one", () => {
    const cache = createTtlCache<string>(3, 1000);
    cache.set("old-1", "x", 0);
    cache.set("old-2", "x", 0);
    cache.set("fresh", "x", 900);
    cache.set("new", "x", 1500);
    expect(cache.size).toBe(2);
    expect(cache.get("fresh", 1500)).toEqual({ value: "x" });
    expect(cache.get("new", 1500)).toEqual({ value: "x" });
  });

  it("keeps what is read over what is not", () => {
    const cache = createTtlCache<string>(3, 1000);
    cache.set("getStats", "x", 0);
    cache.set("b", "x", 0);
    cache.set("c", "x", 0);
    cache.get("getStats", 1);
    cache.set("d", "x", 2);
    expect(cache.get("getStats", 3)).toEqual({ value: "x" });
    expect(cache.get("b", 3)).toBeUndefined();
    expect(cache.size).toBe(3);
  });

  it("replaces a key's value and lifetime without taking a second slot", () => {
    const cache = createTtlCache<string>(2, 1000);
    cache.set("a", "one", 0);
    cache.set("b", "x", 0);
    cache.set("a", "two", 500);
    expect(cache.size).toBe(2);
    expect(cache.get("b", 600)).toEqual({ value: "x" });
    expect(cache.get("a", 1200)).toEqual({ value: "two" });
  });
});

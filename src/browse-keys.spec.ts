import type { Client, ResultSet } from "@libsql/client";
import { describe, expect, it, vi } from "vitest";
import {
  chunkIndexesFor,
  countKey,
  metaValue,
  pageRange,
  parseBrowseKeys,
  readPinned,
  sliceFromChunks,
  sourceIdsChunkKey,
} from "./browse-keys";

const GEN = "20260101000000000";

/** No rows at all: a key that doesn't exist. */
const NO_ROWS = { rows: [] } as unknown as ResultSet;

/** A `ResultSet` holding one `value` per row — all `readPinned` and `metaValue` look at. */
function rows(...values: string[]): ResultSet {
  return { rows: values.map((value) => ({ value })) } as unknown as ResultSet;
}

describe("key formats (pinned to the literals catalog's publish() writes)", () => {
  it("builds a count key, with * for an unset source/category", () => {
    expect(countKey(GEN, "all", "all", undefined, undefined)).toBe(`count:${GEN}:all:all:*:*`);
    expect(countKey(GEN, "gui", "app", "snap", "Utilities")).toBe(
      `count:${GEN}:gui:app:snap:Utilities`,
    );
    // The category goes last: it may contain ":" without making the key ambiguous.
    expect(countKey(GEN, "cli", "game", "flathub", "Role: Playing")).toBe(
      `count:${GEN}:cli:game:flathub:Role: Playing`,
    );
  });

  it("builds a source id-list chunk key", () => {
    expect(sourceIdsChunkKey(GEN, "pacman-aur", 12)).toBe(`sourceIds:${GEN}:pacman-aur:12`);
  });
});

describe("parseBrowseKeys", () => {
  it("reads a well-formed row", () => {
    expect(parseBrowseKeys(JSON.stringify({ generation: GEN, sourceIdsChunkSize: 500 }))).toEqual({
      generation: GEN,
      sourceIdsChunkSize: 500,
    });
  });

  it.each([
    undefined,
    null,
    "",
    "not json",
    "{}",
    JSON.stringify({ generation: GEN }),
    JSON.stringify({ generation: GEN, sourceIdsChunkSize: 0 }),
    JSON.stringify({ generation: 20260101, sourceIdsChunkSize: 500 }),
  ])("treats %j as no browse keys, never throws", (value) => {
    expect(parseBrowseKeys(value)).toBeUndefined();
  });
});

describe("page ranges over a source's ascending id list", () => {
  it("maps an ascending page to its range, clipping the last one", () => {
    expect(pageRange(0, 30, 100, false)).toEqual({ start: 0, end: 30 });
    expect(pageRange(90, 30, 100, false)).toEqual({ start: 90, end: 100 });
  });

  it("maps a descending page to the mirrored range, clipping at the start of the list", () => {
    expect(pageRange(0, 30, 100, true)).toEqual({ start: 70, end: 100 });
    expect(pageRange(90, 30, 100, true)).toEqual({ start: 0, end: 10 });
  });

  it("gives an empty range for a page past the end", () => {
    expect(pageRange(100, 30, 100, false)).toEqual({ start: 0, end: 0 });
    expect(pageRange(100, 30, 100, true)).toEqual({ start: 0, end: 0 });
    expect(pageRange(0, 30, 0, false)).toEqual({ start: 0, end: 0 });
  });

  it("names the chunk rows a range covers, including a straddling page", () => {
    expect(chunkIndexesFor(0, 30, 500)).toEqual([0]);
    expect(chunkIndexesFor(480, 510, 500)).toEqual([0, 1]);
    expect(chunkIndexesFor(500, 530, 500)).toEqual([1]);
    expect(chunkIndexesFor(10, 10, 500)).toEqual([]);
  });

  it("returns exactly the ids a name ASC / name DESC LIMIT/OFFSET page would, for every page of several list sizes", () => {
    const chunkSize = 500;
    for (const total of [0, 1, 29, 30, 31, 499, 500, 501, 1000, 1203]) {
      const ascending = Array.from({ length: total }, (_, i) => `id-${i}`);
      const chunks = new Map<number, string[]>();
      for (let i = 0; i < total; i += chunkSize)
        chunks.set(i / chunkSize, ascending.slice(i, i + chunkSize));

      for (let offset = 0; offset <= total + 30; offset += 30) {
        const asc = pageRange(offset, 30, total, false);
        expect(sliceFromChunks(chunks, asc.start, asc.end, chunkSize)).toEqual(
          ascending.slice(offset, offset + 30),
        );

        // name DESC page = the ascending list reversed, then LIMIT/OFFSET
        const desc = pageRange(offset, 30, total, true);
        // The ascending list reversed, then LIMIT/OFFSET (fresh arrays,
        // reversed in place: toReversed() needs ES2023).
        // eslint-disable-next-line unicorn/no-array-reverse
        const descPage = sliceFromChunks(chunks, desc.start, desc.end, chunkSize).reverse();
        // eslint-disable-next-line unicorn/no-array-reverse
        const expectedDesc = [...ascending].reverse().slice(offset, offset + 30);
        expect(descPage).toEqual(expectedDesc);
      }
    }
  });
});

describe("readPinned", () => {
  const current = JSON.stringify({ generation: GEN, sourceIdsChunkSize: 500 });

  it("returns the statements' results when browseKeys still names the generation read before", async () => {
    const batch = vi.fn<Client["batch"]>().mockResolvedValue([rows(current), rows("42")]);

    const result = await readPinned({ batch }, GEN, [
      { sql: "SELECT value FROM meta WHERE key = ?", args: ["count"] },
    ]);

    expect(result.kind).toBe("ok");
    expect(result.kind === "ok" && metaValue(result.results[0])).toBe("42");
    // One read transaction: the browseKeys row first, the caller's statements after.
    expect(batch).toHaveBeenCalledTimes(1);
    expect(batch.mock.calls[0]?.[1]).toBe("read");
    const sent = batch.mock.calls[0]?.[0] as { args: unknown[] }[];
    expect(sent[0]?.args).toEqual(["browseKeys"]);
  });

  it("reports stale, with the new generation, when a republish happened — so an absent key isn't misread as 0", async () => {
    const next = JSON.stringify({ generation: "20260201000000000", sourceIdsChunkSize: 500 });
    const batch = vi.fn<Client["batch"]>().mockResolvedValue([rows(next), NO_ROWS]);

    const result = await readPinned({ batch }, GEN, [{ sql: "SELECT 1" }]);

    expect(result).toEqual({
      kind: "stale",
      keys: { generation: "20260201000000000", sourceIdsChunkSize: 500 },
    });
  });

  it("reports stale with no keys when the dataset has none anymore", async () => {
    const batch = vi.fn<Client["batch"]>().mockResolvedValue([NO_ROWS, NO_ROWS]);

    expect(await readPinned({ batch }, GEN, [{ sql: "SELECT 1" }])).toEqual({
      kind: "stale",
      keys: undefined,
    });
  });
});

describe("metaValue", () => {
  it("is undefined for a missing key (how an empty combination reads)", () => {
    expect(metaValue(NO_ROWS)).toBeUndefined();
    expect(metaValue(undefined)).toBeUndefined();
    expect(metaValue(rows("7"))).toBe("7");
  });
});

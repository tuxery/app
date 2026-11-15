import { describe, expect, it } from "vitest";
import { buildFtsClause, SEARCH_MIN_WORD_LENGTH } from "~/search-fts";

describe("buildFtsClause", () => {
  it("ORs each word as a quoted FTS5 string over the apps_fts index", () => {
    expect(buildFtsClause("zen browser")).toEqual({
      where: "id IN (SELECT id FROM apps_fts WHERE apps_fts MATCH ?)",
      whereArgs: ['"zen" OR "browser"'],
      match: '"zen" OR "browser"',
    });
  });

  it("never lets user input through as FTS5 syntax", () => {
    expect(buildFtsClause('vlc NOT "gimp*"')?.whereArgs).toEqual(['"vlc" OR "NOT" OR """gimp*"""']);
  });

  it("caps the query at 8 words", () => {
    const match = buildFtsClause("one two three four five six seven eight nine")?.whereArgs[0];
    expect(match?.split(" OR ")).toHaveLength(8);
  });

  it("leaves out the words shorter than a trigram", () => {
    expect(SEARCH_MIN_WORD_LENGTH).toBe(3);
    expect(buildFtsClause("obs qt")?.match).toBe('"obs"');
    expect(buildFtsClause("a vlc 5 player")?.match).toBe('"vlc" OR "player"');
    // The cap counts the words that are kept.
    expect(buildFtsClause("a b c d e f g h firefox")?.match).toBe('"firefox"');
  });

  it("has nothing to look up when no word is long enough", () => {
    expect(buildFtsClause("qt")).toBeUndefined();
    expect(buildFtsClause("a")).toBeUndefined();
    expect(buildFtsClause("go vi qt")).toBeUndefined();
    expect(buildFtsClause("   ")).toBeUndefined();
    expect(buildFtsClause("")).toBeUndefined();
  });

  it("takes LIKE's wildcards as plain text", () => {
    expect(buildFtsClause("lib_x")?.match).toBe('"lib_x"');
    expect(buildFtsClause("100%")?.match).toBe('"100%"');
  });

  it("leaves out words with no letter or digit", () => {
    expect(buildFtsClause("%%%")).toBeUndefined();
    expect(buildFtsClause("___ ... --- ***")).toBeUndefined();
    expect(buildFtsClause("%%% gimp")?.match).toBe('"gimp"');
    expect(buildFtsClause("c++")?.match).toBe('"c++"');
  });

  it("counts characters, not UTF-16 code units", () => {
    expect(buildFtsClause("日本語")).toBeDefined();
    expect(buildFtsClause("𝐚𝐛𝐜")).toBeDefined();
    expect(buildFtsClause("𝐚𝐛")).toBeUndefined();
  });
});

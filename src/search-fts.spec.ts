import { describe, expect, it } from "vitest";
import { buildFtsClause } from "~/search-fts";

describe("buildFtsClause", () => {
  it("ORs each word as a quoted FTS5 string over the apps_fts index", () => {
    expect(buildFtsClause("zen browser")).toEqual({
      where: "id IN (SELECT id FROM apps_fts WHERE apps_fts MATCH ?)",
      whereArgs: ['"zen" OR "browser"'],
    });
  });

  it("never lets user input through as FTS5 syntax", () => {
    expect(buildFtsClause('vlc NOT "gimp*"')?.whereArgs).toEqual(['"vlc" OR "NOT" OR """gimp*"""']);
  });

  it("caps the query at 8 words, like the LIKE clause", () => {
    const match = buildFtsClause("one two three four five six seven eight nine")?.whereArgs[0];
    expect(match?.split(" OR ")).toHaveLength(8);
  });

  it("leaves queries FTS5 can't answer identically to the LIKE scan", () => {
    // Shorter than a trigram: FTS5 matches nothing.
    expect(buildFtsClause("qt")).toBeUndefined();
    expect(buildFtsClause("obs qt")).toBeUndefined();
    // LIKE wildcards: LIKE would match them as patterns, trigram as text.
    expect(buildFtsClause("lib_x")).toBeUndefined();
    expect(buildFtsClause("100%")).toBeUndefined();
    expect(buildFtsClause("   ")).toBeUndefined();
  });

  it("counts characters, not UTF-16 code units", () => {
    expect(buildFtsClause("🦊🦊🦊")).toBeDefined();
    expect(buildFtsClause("🦊🦊")).toBeUndefined();
  });
});

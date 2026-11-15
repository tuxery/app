// Pure half of /browse's free-text search over catalog's `apps_fts` index,
// split out of `~/catalog` (which needs a database) so the user-input
// handling is unit-tested on its own (search-fts.spec.ts).

/** The shortest word a search acts on: a trigram, the smallest thing `apps_fts` can look up. */
export const SEARCH_MIN_WORD_LENGTH = 3;

const MAX_WORDS = 8;

/**
 * Whether the index can answer for a word, and it is worth asking: at least
 * a trigram long (counted in characters, not UTF-16 units), with a letter or
 * a digit in it. A word of punctuation only (`...`, `---`, `%%%`) names
 * nothing, yet as a trigram it matches every description that happens to
 * contain it.
 */
function isSearchableWord(word: string): boolean {
  return [...word].length >= SEARCH_MIN_WORD_LENGTH && /[\p{L}\p{N}]/u.test(word);
}

/**
 * The free-text condition as a lookup in catalog's `apps_fts` index (an
 * FTS5 table, trigram tokenizer, over id/name/short_description — see
 * `tuxery/catalog`'s `APPS_FTS_SQL`): the apps with any of the query's words
 * in one of those three fields, as a substring, whatever the case. Its cost
 * grows with the number of matches — see `~/catalog`'s `searchFtsOnly`.
 * `match` is the bare FTS5 query, `where` the same lookup as a condition on
 * `apps`.
 *
 * It is the only way a free-text query reaches the database. The alternative
 * for what the index can't look up, a `LIKE '%word%'`, reads every row of
 * `apps` on every request, and Turso bills rows read: so words the index
 * can't answer for (`isSearchableWord`) are left out of the query, and
 * `undefined` — nothing to look up, the caller shows "type at least
 * `SEARCH_MIN_WORD_LENGTH` characters" without querying — when none is left.
 * `%` and `_` are plain text here (they are wildcards to `LIKE` only).
 */
export function buildFtsClause(
  trimmed: string,
): { where: string; whereArgs: string[]; match: string } | undefined {
  const words = trimmed.split(/\s+/).filter(isSearchableWord).slice(0, MAX_WORDS);
  if (words.length === 0) return undefined;
  // Each word quoted as an FTS5 string (inner quotes doubled), so user
  // input is never parsed as FTS5 query syntax (AND/NOT/*/column filters).
  const match = words.map((word) => `"${word.replaceAll('"', '""')}"`).join(" OR ");
  return {
    where: "id IN (SELECT id FROM apps_fts WHERE apps_fts MATCH ?)",
    whereArgs: [match],
    match,
  };
}

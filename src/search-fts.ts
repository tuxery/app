// Pure half of /browse's free-text search over catalog's `apps_fts` index,
// split out of `~/catalog` (which needs a database) so the user-input
// handling is unit-tested on its own (search-fts.spec.ts).

/**
 * The free-text condition as a lookup in catalog's `apps_fts` index (an
 * FTS5 table, trigram tokenizer, over id/name/short_description — see
 * `tuxery/catalog`'s `APPS_FTS_SQL`) instead of `buildSearchClause`'s
 * `LIKE '%word%'` scan. Trigram matches exactly the rows those LIKEs match,
 * so the result set — and `buildSearchClause`'s ranking applied on top of
 * it — is unchanged; only the cost is: ~5 rows read per matching app
 * (page + count) instead of two full scans of `apps` (~172k rows each),
 * measured on preview 2026-10-04. `undefined` — the caller keeps the LIKE
 * scan for that query rather than return different results — when a word
 * is shorter than a trigram (3 characters, which FTS5 can't match), or
 * contains `%`/`_`, which LIKE treats as wildcards and trigram as text.
 */
export function buildFtsClause(
  trimmed: string,
): { where: string; whereArgs: string[] } | undefined {
  const words = trimmed.split(/\s+/).filter(Boolean).slice(0, 8);
  if (words.length === 0 || words.some((word) => [...word].length < 3 || /[%_]/.test(word))) {
    return undefined;
  }
  // Each word quoted as an FTS5 string (inner quotes doubled), so user
  // input is never parsed as FTS5 query syntax (AND/NOT/*/column filters).
  const match = words.map((word) => `"${word.replaceAll('"', '""')}"`).join(" OR ");
  return { where: "id IN (SELECT id FROM apps_fts WHERE apps_fts MATCH ?)", whereArgs: [match] };
}

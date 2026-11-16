// A small in-memory cache with a lifetime per entry and a ceiling on how
// many it holds, for `~/catalog`'s per-isolate listing cache: part of its
// keys comes from the request (a category, a page number), so without a
// ceiling anyone could grow it until the Worker runs out of memory. Pure,
// unit-tested in ttl-cache.spec.ts.

export interface TtlCache<V> {
  /** The entry for `key` if it is still fresh, wrapped so a cached `undefined` can be told from a miss. */
  get(key: string, now?: number): { value: V } | undefined;
  set(key: string, value: V, now?: number): void;
  readonly size: number;
}

/**
 * At most `maxEntries` entries, each kept `ttlMs`. An expired entry is
 * dropped when it is asked for; when a new key would go over the ceiling,
 * every expired entry goes first, then the least recently used ones (a `Map`
 * iterates in insertion order, and a read moves its entry to the end), so
 * the keys every page needs outlive a flood of one-off ones.
 */
export function createTtlCache<V>(maxEntries: number, ttlMs: number): TtlCache<V> {
  const entries = new Map<string, { value: V; expiresAt: number }>();

  const makeRoom = (now: number): void => {
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) entries.delete(key);
    }
    for (const key of entries.keys()) {
      if (entries.size < maxEntries) break;
      entries.delete(key);
    }
  };

  return {
    get(key, now = Date.now()) {
      const entry = entries.get(key);
      if (!entry) return undefined;
      entries.delete(key);
      if (entry.expiresAt <= now) return undefined;
      entries.set(key, entry);
      return { value: entry.value };
    },
    set(key, value, now = Date.now()) {
      entries.delete(key);
      if (entries.size >= maxEntries) makeRoom(now);
      entries.set(key, { value, expiresAt: now + ttlMs });
    },
    get size() {
      return entries.size;
    },
  };
}

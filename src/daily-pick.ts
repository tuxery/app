/** Milliseconds in a UTC day. */
const DAY = 86_400_000;

/**
 * `count` items of `items` that change once a day, at midnight UTC: the
 * same pick all day for everyone, the next ones in the list the day after,
 * wrapping around, so each item gets its turn. Pure and computed from the
 * date it's given, so a page can run it in the browser after its listing
 * loads without making the edge-cached HTML depend on the day.
 */
export function dailyPick<T>(items: readonly T[], date: Date, count = 1): T[] {
  if (items.length === 0 || count <= 0) return [];
  if (count >= items.length) return [...items];
  const day = Math.floor(date.getTime() / DAY);
  const start = (((day * count) % items.length) + items.length) % items.length;
  return Array.from({ length: count }, (_, i) => items[(start + i) % items.length]);
}

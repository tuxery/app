// Formatting for the product page's activity and reach facts — the
// latest release's age and Flathub install counts. Pure (the current time
// is passed in), unit-tested in app-facts.spec.ts.

const DAY_MS = 24 * 60 * 60 * 1000;

const ago = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;

/** "today", "3 days ago", "2 months ago", "1 year ago" — the age of a release date, `undefined` for a missing or unreadable date. */
export function releaseAge(iso: string | undefined, now: Date): string | undefined {
  const time = iso ? Date.parse(iso) : Number.NaN;
  if (Number.isNaN(time)) return undefined;
  const days = Math.floor((now.getTime() - time) / DAY_MS);
  if (days < 1) return "today";
  if (days < 31) return ago(days, "day");
  if (days < 365) return ago(Math.floor(days / 30.44), "month");
  return ago(Math.floor(days / 365.25), "year");
}

/** "12M", "4.2K", "830" — an install count short enough for the page header. */
export function compactCount(count: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    count,
  );
}

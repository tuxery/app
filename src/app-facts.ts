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

/** "October 5, 2026" — a release date as written on the page, in UTC like the dates the catalog stores. */
export function formatReleaseDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", { dateStyle: "long", timeZone: "UTC" });
}

export interface DataConfidence {
  score: number;
  signals: { signal: string; delta: number; detail: string }[];
}

export interface ConfidenceNote {
  tone: "good" | "warning";
  text: string;
  /** The full detail when `text` shortens it (a long list of names). */
  title?: string;
}

/**
 * The catalog's data-confidence signals as sentences for the product page
 * ("6 independent sources agree", "Sources disagree on the name: jan /
 * janlive"), strongest first. Empty when there's nothing to say — a single
 * source, or nothing flagged — never a made-up verdict.
 */
export function confidenceNotes(confidence: DataConfidence | undefined): ConfidenceNote[] {
  if (!confidence) return [];
  const notes: ConfidenceNote[] = [];
  for (const { signal, detail } of confidence.signals) {
    if (signal === "force-match-verified") {
      notes.push({ tone: "good", text: "Sources matched and checked by hand" });
    } else if (signal === "multi-source-corroboration") {
      const sources = /(\d+) independent sources/.exec(detail)?.[1];
      notes.push({
        tone: "good",
        text: sources ? `${sources} independent sources agree` : "Several sources agree",
      });
    } else if (signal === "name-disagreement") {
      const names = /disagree on name: (.+?)\.?$/.exec(detail)?.[1];
      const count = names?.split(" / ").length ?? 0;
      // A long list (every build's own package name) reads as noise: the
      // count, with the names in the tooltip.
      notes.push(
        names && count > 3
          ? { tone: "warning", text: `Sources use ${count} different names`, title: names }
          : {
              tone: "warning",
              text: names
                ? `Sources disagree on the name: ${names}`
                : "Sources disagree on the name",
            },
      );
    } else if (signal === "license-family-conflict") {
      notes.push({ tone: "warning", text: "Sources disagree on the license" });
    }
  }
  return notes.toSorted((a, b) => (a.tone === b.tone ? 0 : a.tone === "good" ? -1 : 1));
}

// Upstream store selections worth showing as badges ("verified" has its
// own badge next to the developer).
const STORE_PICK_LABELS: Record<string, string> = {
  "recently-added": "New on Flathub",
  "recently-updated": "Recently updated on Flathub",
  featured: "Featured on the Snap Store",
};

/** Store selections an app appears in, as badge labels, in a fixed order. */
export function storePicks(storeCollections: string[] | undefined): string[] {
  const picks = new Set(storeCollections);
  return Object.entries(STORE_PICK_LABELS)
    .filter(([collection]) => picks.has(collection))
    .map(([, label]) => label);
}

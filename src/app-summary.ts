import { unique } from "helpers4/array";
import { isNullish } from "helpers4/guard";
import {
  summarizeBuilds,
  summarizeReleaseLines,
  summarizeRatingsBySource,
  verifiedSourcesOf,
  type AppSummary,
  type SourcedPackage,
} from "~/catalog-types";

// A database row (`SUMMARY_COLUMNS`, or one of catalog's precomputed
// `listingRows:*`) as the card a listing shows. No database import: the
// homepage turns its rows into cards in the browser (see `/api/home/`).

/** A row as `@libsql/client` returns it, or as catalog stores it in `listingRows:*`. */
export type Row = Record<string, unknown>;


export function parseRating(row: Row): { average: number; count: number } | undefined {
  return isNullish(row.rating_average)
    ? undefined
    : { average: row.rating_average as number, count: (row.rating_count as number | null) ?? 0 };
}

export function toSummary(row: Row): AppSummary {
  const packages = JSON.parse(row.packages_json as string) as SourcedPackage[];
  return {
    id: row.id as string,
    name: row.name as string,
    shortDescription: row.short_description as string,
    iconUrl: (row.icon_url as string | null) ?? undefined,
    kind: row.kind === "gui" ? "gui" : undefined,
    contentType: row.content_type === "game" ? "game" : undefined,
    category: row.category as string,
    rating: parseRating(row),
    ratingsBySource: summarizeRatingsBySource(packages),
    // Deduplicated — a merged app can carry two packages from the same
    // source now (e.g. AUR's official + -git build), and a summary card
    // only needs to say "AUR" once, not distinguish the build — that's
    // what builds is for instead.
    sources: unique(packages.map((pkg) => pkg.source)),
    builds: summarizeBuilds(packages),
    releaseLines: summarizeReleaseLines(packages),
    verifiedSources: verifiedSourcesOf(packages),
  };
}


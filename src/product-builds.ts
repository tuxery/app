// Client-safe: which release lines a product has, and the URL of each.
// A product page shows one combination of edition (catalog's `track`) and
// version (catalog's `risk`) — see catalog's docs/product-families.md —
// selected through its path: `/app/firefox/` (Standard · Stable),
// `/app/firefox/esr/`, `/app/firefox/nightly/`, `/app/firefox/esr/beta/`.

import { riskLabel, trackLabel, type Risk, type SourcedPackage } from "~/catalog-types";

/** One edition/version combination; `undefined` is the default line and stable. */
export interface BuildSelection {
  track?: string;
  risk?: Risk;
}

export interface BuildOption<T> {
  value: T;
  label: string;
}

// A single path segment is a version when it's one of these, an edition
// otherwise — the risk vocabulary is closed, and catalog never names a
// track after one of them.
const RISKS: readonly Risk[] = ["candidate", "beta", "nightly", "git"];

function isRisk(segment: string): segment is Risk {
  return (RISKS as readonly string[]).includes(segment);
}

/** Reads the edition/version path segments after `/app/<id>/`; `undefined` when they can't be one. */
export function parseBuildPath(segments: readonly string[]): BuildSelection | undefined {
  const [first, second, ...extra] = segments.filter(Boolean);
  if (extra.length > 0) return undefined;
  if (first === undefined) return {};
  if (second === undefined) return isRisk(first) ? { risk: first } : { track: first };
  if (isRisk(first) || !isRisk(second)) return undefined;
  return { track: first, risk: second };
}

/** The page URL of one combination of a product. */
export function buildPath(appId: string, { track, risk }: BuildSelection): string {
  const segments = [appId, track, risk].filter((segment): segment is string => Boolean(segment));
  return `/app/${segments.map(encodeURIComponent).join("/")}/`;
}

function matches(pkg: SourcedPackage, { track, risk }: BuildSelection): boolean {
  return pkg.track === track && pkg.risk === risk;
}

/** Every package of one combination. */
export function packagesOf(
  packages: readonly SourcedPackage[],
  selection: BuildSelection,
): SourcedPackage[] {
  return packages.filter((pkg) => matches(pkg, selection));
}

/** Whether a product has this combination at all. */
export function hasBuild(packages: readonly SourcedPackage[], selection: BuildSelection): boolean {
  return packages.some((pkg) => matches(pkg, selection));
}

/** The product's editions, Standard first, then in package order. */
export function editionsOf(packages: readonly SourcedPackage[]): BuildOption<string | undefined>[] {
  // Not a sort: Array#sort always puts `undefined` last, never asking the comparator.
  const tracks = new Set(packages.map((pkg) => pkg.track));
  const ordered = [
    ...(tracks.has(undefined) ? [undefined] : []),
    ...[...tracks].filter((track) => track !== undefined),
  ];
  return ordered.map((track) => ({ value: track, label: trackLabel(track) }));
}

/** One edition's versions, from the most to the least mature. */
export function versionsOf(
  packages: readonly SourcedPackage[],
  track: string | undefined,
): BuildOption<Risk | undefined>[] {
  const risks = new Set(packages.filter((pkg) => pkg.track === track).map((pkg) => pkg.risk));
  return [undefined, ...RISKS]
    .filter((risk) => risks.has(risk))
    .map((risk) => ({ value: risk, label: riskLabel(risk) }));
}

/** Each edition's versions, keyed by its track (`""` for Standard) — small enough to hand to a client component instead of every package. */
export function versionsByEdition(
  packages: readonly SourcedPackage[],
): Record<string, BuildOption<Risk | undefined>[]> {
  return Object.fromEntries(
    editionsOf(packages).map((edition) => [
      edition.value ?? "",
      versionsOf(packages, edition.value),
    ]),
  );
}

/**
 * The combination to show after picking an edition: same version when that
 * edition has it, else its most mature one.
 */
export function selectEdition(
  versions: Record<string, BuildOption<Risk | undefined>[]>,
  track: string | undefined,
  current: BuildSelection,
): BuildSelection {
  const available = versions[track ?? ""] ?? [];
  const keep = available.some((version) => version.value === current.risk);
  return { track, risk: keep ? current.risk : available[0]?.value };
}

/** Version-specific facts of one combination — see `buildFacts`. */
export interface BuildFacts {
  rating?: { average: number; count: number };
  approxSizeBytes?: number;
  changelog?: string;
}

/**
 * The facts that belong to one release rather than to the product — rating,
 * download size, changelog — read from that combination's own packages
 * only. Anything they don't carry stays `undefined`: a page about Firefox
 * ESR never shows the stable release's size or rating as if it were ESR's.
 * Descriptive content (description, screenshots, developer) is the
 * product's and isn't here.
 */
export function buildFacts(packages: readonly SourcedPackage[]): BuildFacts {
  const rated = packages.filter((pkg) => pkg.rating);
  const count = rated.reduce((total, pkg) => total + (pkg.rating?.count ?? 0), 0);
  const average =
    count > 0
      ? rated.reduce(
          (total, pkg) => total + (pkg.rating?.average ?? 0) * (pkg.rating?.count ?? 0),
          0,
        ) / count
      : undefined;
  return {
    rating: average === undefined ? undefined : { average, count },
    approxSizeBytes: packages.find((pkg) => pkg.approxSizeBytes)?.approxSizeBytes,
    changelog: packages.find((pkg) => pkg.changelog)?.changelog,
  };
}

/** "ESR", "Nightly", "ESR · Beta" — a combination's name; the default one is "Standard". */
export function selectionLabel({ track, risk }: BuildSelection): string {
  if (!track && !risk) return trackLabel(undefined);
  return [track ? trackLabel(track) : "", risk ? riskLabel(risk) : ""].filter(Boolean).join(" · ");
}

/**
 * The other combinations a set of packages offers, most packages first —
 * what a platform without the current combination still has (Debian ships
 * Firefox ESR only).
 */
export function otherSelections(
  packages: readonly SourcedPackage[],
  current: BuildSelection,
): BuildSelection[] {
  const counts = new Map<string, { selection: BuildSelection; count: number }>();
  for (const pkg of packages) {
    if (pkg.track === current.track && pkg.risk === current.risk) continue;
    const key = `${pkg.track ?? ""}/${pkg.risk ?? ""}`;
    const entry = counts.get(key) ?? { selection: { track: pkg.track, risk: pkg.risk }, count: 0 };
    entry.count++;
    counts.set(key, entry);
  }
  return [...counts.values()].toSorted((a, b) => b.count - a.count).map((entry) => entry.selection);
}

/**
 * The combination a product's plain `/app/<id>/` page shows: Standard ·
 * Stable when the product has it, else — a product published only on a
 * Snap `edge` channel, or only as an AUR `-git` build — its default
 * edition's most mature version (any edition's, when it has no default
 * one either).
 */
export function defaultSelection(packages: readonly SourcedPackage[]): BuildSelection {
  if (hasBuild(packages, {})) return {};
  const editions = editionsOf(packages);
  const track = editions.some((edition) => edition.value === undefined)
    ? undefined
    : editions[0]?.value;
  return { track, risk: versionsOf(packages, track)[0]?.value };
}

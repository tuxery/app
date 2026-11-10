import { safeParseStrict } from "helpers4/json";

// tuxery/catalog's config/source-terms.json, as its publish writes it to the
// `sourceTerms` meta row (catalog's src/pipeline/source-terms.ts). Rendered
// by /docs/sources/<id>/. No shared package between the repos: this type
// mirrors the fields the page reads, and a malformed row reads as absent.

export interface SourceTermsEvidence {
  url: string;
  /** Whether we could read the page itself (false: behind an anti-bot check, a 404...). */
  read: boolean;
  finding: string;
}

export interface SourceTermsRecord {
  verdict: string;
  automatedFetch: string;
  publicStorage: string;
  attribution: string | null;
  fieldLicense: string;
  evidence: SourceTermsEvidence[];
  note?: string;
}

export interface SourceTerms {
  checkedOn: string;
  disclaimer: string;
  sources: Record<string, SourceTermsRecord>;
}

export const SOURCE_TERMS_META_KEY = "sourceTerms";

/** The `sourceTerms` row's JSON, `undefined` when absent or malformed. */
export function parseSourceTerms(value: unknown): SourceTerms | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = safeParseStrict<Partial<SourceTerms>>(value);
  return typeof parsed?.checkedOn === "string" &&
    typeof parsed.sources === "object" &&
    parsed.sources !== null
    ? (parsed as SourceTerms)
    : undefined;
}

/**
 * The catalog records that describe one of the app's sources: its own, plus
 * the AppStream connector catalog counts with it (`deb-debian` and
 * `deb-debian-appstream`), own record first. Pure.
 */
export function recordsFor(
  terms: SourceTerms,
  source: string,
): { id: string; record: SourceTermsRecord }[] {
  return [source, `${source}-appstream`]
    .filter((id) => terms.sources[id])
    .map((id) => ({ id, record: terms.sources[id] as SourceTermsRecord }));
}

/** Plain-words labels for the record's codes. */
export const VERDICT_LABELS: Record<string, string> = {
  clear: "Clear: the terms allow our use",
  "low-risk-no-terms": "Low risk: no terms found, a public index made for software",
  "owner-review": "Under review: the terms restrict or don't settle our use",
};

export const FETCH_LABELS: Record<string, string> = {
  allowed: "Allowed",
  "public-mirror-no-terms": "A public mirror, no terms found",
  discouraged: "Discouraged (robots.txt or terms)",
  "forbidden-by-text": "Forbidden by its terms: paused",
  "not-applicable": "Not applicable (our own list)",
  unverified: "Not verified",
};

export const STORAGE_LABELS: Record<string, string> = {
  allowed: "Public: in our repository and the open-data downloads",
  forbidden: "Private: shown on Tuxery, never redistributed",
  unclear: "Public, though no document settles it",
};

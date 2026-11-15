// The one rule for a URL that came with catalog data and ends up in an
// `href` or a `src`. That data is collected from public package indexes
// anyone can publish to (an AUR package's `url=` field is free text), so a
// `javascript:` or `data:` URL there would run in the visitor's browser the
// moment they click "Homepage". Pure, unit-tested in safe-url.spec.ts.

// Any ASCII control character or whitespace: never part of a real URL, and
// what a browser strips before reading the scheme.
// eslint-disable-next-line no-control-regex
const CONTROL_OR_SPACE = /[\u0000- \u007f]/;

/**
 * `value` if it is an absolute `http://` or `https://` URL with a host,
 * `undefined` for anything else: another scheme (`javascript:`, `data:`,
 * `ftp:`, `mailto:`), no scheme at all (`www.example.org`, which a browser
 * would resolve as a path on this site), a protocol-relative `//host`, or a
 * value that isn't a string.
 */
export function httpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed) || CONTROL_OR_SPACE.test(trimmed)) return undefined;
  try {
    const { protocol, hostname } = new URL(trimmed);
    return (protocol === "http:" || protocol === "https:") && hostname ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

/** The `httpUrl`s of a list, in order; `undefined` when there is no list. */
export function httpUrls(values: unknown): string[] | undefined {
  if (!Array.isArray(values)) return undefined;
  return values.flatMap((value) => httpUrl(value) ?? []);
}

/** A record of named links with only its `httpUrl` values left; `undefined` when there is no record. */
export function httpLinks<T extends Record<string, unknown>>(
  links: T | null | undefined,
): { [K in keyof T]?: string } | undefined {
  if (typeof links !== "object" || links === null || Array.isArray(links)) return undefined;
  const kept: Record<string, string> = {};
  for (const [name, value] of Object.entries(links)) {
    const url = httpUrl(value);
    if (url) kept[name] = url;
  }
  return kept as { [K in keyof T]?: string };
}

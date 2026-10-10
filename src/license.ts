// Whether an app's license makes it free software, from the license string
// the catalog carries — 2,500+ spellings of the same few licenses across
// sources ("GPL3", "GPL-3.0-or-later", "GPLv3", Arch's "custom:<name>",
// SPDX expressions such as "BSD AND custom AND MIT"). Pure, unit-tested in
// license.spec.ts. App-side only: the catalog's data stays as each source
// published it.
//
// Rule shared with the provenance badge: unknown is never shown as a
// verdict. A license only counts as free when every part of it is a
// recognized free license, and as proprietary when a part says so
// explicitly; anything else ("custom", "unknown", source-available terms
// like BUSL, non-commercial Creative Commons) gets no badge at all.

export type LicenseKind = "free" | "proprietary" | "unknown";

// Families of licenses the FSF or the OSI approve, as spelled across
// sources (SPDX ids, Arch and Debian shorthands). Matched at the start of
// one normalized term, so "GPL", "GPLv3", "GPL-3.0-or-later" and "GPL2+"
// all fall under GPL. Creative Commons only without NC/ND.
const FREE_TERM =
  /^(MIT|X11|ISC|ZLIB|UNLICENSE|0BSD|BSD|APACHE|AGPL|LGPL|GPL|MPL|EPL|CDDL|ARTISTIC|PSF|PYTHON|OFL|CC0|CC-BY(?!-(NC|ND))|CC-BY-SA|WTFPL|BSL-1|BOOST|RUBY|PHP|VIM|AFL|EUPL|OSL|MS-PL|NCSA|PERL|PUBLIC ?DOMAIN|LPPL|LIBPNG|CURL|UNICODE|BLUEOAK|MIROS|FTL|IJG|OPENSSL|SLEEPYCAT|W3C|ZPL|MULANPSL|GFDL|FDL|POSTGRESQL|BZIP2)/;

// Words that say a term is proprietary on its own ("End User ... License
// Agreement" is an EULA spelled out).
const PROPRIETARY_TERM =
  /\b(PROPRIETARY|EULA|END[- ]USER|COMMERCIAL|FREEWARE|SHAREWARE|NON-?FREE|ALL RIGHTS RESERVED)\b/;

function classifyTerm(term: string): LicenseKind {
  // Arch's "custom:<name>" names a license it doesn't otherwise know —
  // free or not depending on the name ("custom:BSD-2-clause" vs
  // "custom:Brother EULA").
  const name = term
    .replace(/^custom:\s*/i, "")
    .replace(/^LicenseRef-/i, "")
    .trim()
    .toUpperCase();
  if (PROPRIETARY_TERM.test(name)) return "proprietary";
  if (FREE_TERM.test(name)) return "free";
  return "unknown";
}

export function classifyLicense(license: string | undefined): LicenseKind {
  if (!license?.trim()) return "unknown";
  const terms = license
    .split(/\s+(?:AND|OR)\s+|[,;()]|\s+\/\s+/i)
    // "GPL-3.0-or-later WITH GCC-exception-3.1": an exception only adds
    // permissions, it doesn't change the license it applies to.
    .map((term) => term.split(/\s+WITH\s+/i)[0] ?? "")
    .map((term) => term.trim())
    .filter(Boolean);
  if (terms.length === 0) return "unknown";

  const kinds = terms.map(classifyTerm);
  if (kinds.includes("proprietary")) {
    // "MIT OR proprietary" is a choice that includes a free one.
    return /\sOR\s/i.test(license) && kinds.includes("free") ? "unknown" : "proprietary";
  }
  return kinds.every((kind) => kind === "free") ? "free" : "unknown";
}

/** The docs page explaining the common free licenses, one section per family. */
export const LICENSE_GUIDE_PATH = "/docs/open-source-licenses/";

// Section of the guide for a single license term, by family — the ids
// the docs' Markdown generates from each heading ("GPL 3.0" → "gpl-30").
// Checked in order, so "LGPL" and "AGPL" are tried before "GPL".
const GUIDE_SECTIONS: [RegExp, string][] = [
  [/^AGPL/, "agpl-30"],
  [/^LGPL/, "lgpl"],
  [/^GPL[-V]?2|^GPL-2/, "gpl-20"],
  [/^GPL/, "gpl-30"],
  [/^MPL/, "mpl-20"],
  [/^APACHE/, "apache-20"],
  [/^BSD|^0BSD/, "bsd"],
  [/^(MIT|X11|ISC)/, "mit"],
  [/^(UNLICENSE|CC0|PUBLIC ?DOMAIN|WTFPL)/, "public-domain"],
];

/** Every section `licenseInfoHref` links to — pinned against the page by e2e/docs.spec.ts. */
export const LICENSE_GUIDE_SECTIONS = [...GUIDE_SECTIONS.map(([, id]) => id), "several-licenses"];

// A bare SPDX identifier (no spaces, no Arch "custom:"), for the SPDX
// license list when the guide has no section for it.
const SPDX_ID = /^[A-Za-z0-9.+-]+$/;

/**
 * Where to learn what an app's license lets you do: the guide's section
 * for a common free license ("MIT", "GPL-3.0-or-later", "GPL3"...), the
 * guide's top for an expression combining several licenses, SPDX's page
 * for any other single SPDX id, the glossary for a proprietary license.
 * `undefined` when there's nothing useful to link (no verdict, no id).
 */
export function licenseInfoHref(license: string | undefined): string | undefined {
  const kind = classifyLicense(license);
  if (kind === "proprietary") return "/docs/glossary/#proprietary";
  if (kind !== "free" || !license) return undefined;
  const term = license.trim();
  if (/\s(AND|OR)\s|[,;]/i.test(term)) return `${LICENSE_GUIDE_PATH}#several-licenses`;
  const name =
    term
      .split(/\s+WITH\s+/i)[0]
      ?.trim()
      .toUpperCase() ?? "";
  const section = GUIDE_SECTIONS.find(([pattern]) => pattern.test(name))?.[1];
  if (section) return `${LICENSE_GUIDE_PATH}#${section}`;
  return SPDX_ID.test(term)
    ? `https://spdx.org/licenses/${encodeURIComponent(term)}.html`
    : undefined;
}

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

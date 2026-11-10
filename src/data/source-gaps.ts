import type { PackageSourceId } from "~/catalog-types";

// What Tuxery can't show from each source, and why — kept by hand, like
// /docs/sources/'s METHODS, from tuxery/catalog's config/source-terms.json
// (permissions and answers) and docs/sources.md (what each connector reads).
// Rendered by /docs/source-gaps/; the "todo" gaps are what /docs/contribute/
// points contributors to.

/** Why a detail is missing. */
export type GapReason = "refused" | "not-published" | "waiting" | "todo" | "kept-private";

export const GAP_REASONS: Record<GapReason, { label: string; description: string }> = {
  refused: {
    label: "Refused by the source",
    description: "The source publishes it, but asked us not to collect it.",
  },
  "not-published": {
    label: "Not published by the source",
    description: "The source doesn't make it available, to us or anyone.",
  },
  waiting: {
    label: "Waiting on the source",
    description: "The source said it's working on it, or we've asked and wait for an answer.",
  },
  todo: {
    label: "Not built yet",
    description: "It's available and allowed: nobody has built it yet. Help welcome.",
  },
  "kept-private": {
    label: "Kept private",
    description:
      "Shown on Tuxery, but left out of the open-data downloads, by the source's request or our own caution.",
  },
};

export interface SourceGap {
  /** What's missing, as a visitor would name it. */
  what: string;
  reason: GapReason;
  /** One or two sentences: the specifics, in plain words. */
  note: string;
}

export interface SourceGapEntry {
  /** A source of /docs/sources/, or a details-only one ("odrs"). */
  id: PackageSourceId | "odrs";
  label: string;
  /** Where we stand with the source's maintainers about using their data. */
  permission: string;
  gaps: SourceGap[];
}

const ASKED_WAITING = "Asked on 2026-11-09; waiting for an answer.";

export const SOURCE_GAPS: SourceGapEntry[] = [
  {
    id: "flatpak-flathub",
    label: "Flathub",
    permission:
      "Asked on 2026-11-09. Flathub answered that we may read the AppStream file it publishes for software centers, and that scraping its API is not welcome.",
    gaps: [
      {
        what: "Install counts (total and last 7 days)",
        reason: "refused",
        note: "Only published through Flathub's API. This is why Tuxery has no Download trends row and shows no install figures.",
      },
      {
        what: "Download size and sandbox permissions",
        reason: "refused",
        note: "Only published through Flathub's API, so Flathub apps show neither for now.",
      },
      {
        what: "Flathub's Popular, Recently added and Recently updated lists",
        reason: "refused",
        note: "Only published through Flathub's API. Popularity on Tuxery comes from the AUR, Debian's popcon and Arch's pkgstats instead.",
      },
      {
        what: "Recently updated apps",
        reason: "todo",
        note: "Flathub's AppStream file carries every release's date, enough to rebuild this list ourselves.",
      },
      {
        what: "Open-data download",
        reason: "kept-private",
        note: "Flathub didn't say whether a public copy of its AppStream data is fine, and its site terms forbid copying any part of its service.",
      },
    ],
  },
  {
    id: "flatpak-appcenter",
    label: "elementary AppCenter",
    permission: "Not asked yet.",
    gaps: [
      {
        what: "Install counts",
        reason: "not-published",
        note: "AppCenter publishes none.",
      },
    ],
  },
  {
    id: "snap-snapcraft",
    label: "Snap Store",
    permission: "Not asked yet: planned for mid-November 2026.",
    gaps: [
      {
        what: "Install counts and ratings",
        reason: "not-published",
        note: "The Snap Store shows neither publicly, so Snap-only apps can't appear in trending lists.",
      },
    ],
  },
  {
    id: "appimagehub",
    label: "AppImageHub",
    permission:
      "Allowed by opendesktop.org on 2026-10-20, extended on 2026-11-10 to descriptions and preview images, on conditions (see Open data).",
    gaps: [
      {
        what: "A real icon and license",
        reason: "waiting",
        note: "Their API doesn't expose them yet; opendesktop.org is working on it. Meanwhile the first preview image, usually the icon, stands in.",
      },
      {
        what: "Open-data download",
        reason: "kept-private",
        note: "opendesktop.org's condition: the texts are written by its uploaders and may not be redistributed.",
      },
    ],
  },
  {
    id: "gog",
    label: "GOG",
    permission: "Not asked yet.",
    gaps: [
      {
        what: "Open-data download",
        reason: "kept-private",
        note: "Our own precaution: we couldn't read GOG's User Agreement, and the data holds its store descriptions.",
      },
    ],
  },
  {
    id: "rpm-fedora",
    label: "Fedora",
    permission: ASKED_WAITING,
    gaps: [
      {
        what: "Popularity",
        reason: "not-published",
        note: "Fedora publishes no install statistics, so Fedora-only apps can't appear in trending lists.",
      },
    ],
  },
  {
    id: "rpm-opensuse",
    label: "openSUSE",
    permission: ASKED_WAITING,
    gaps: [
      {
        what: "Popularity",
        reason: "not-published",
        note: "openSUSE publishes no install statistics.",
      },
    ],
  },
  { id: "nix-nixpkgs", label: "Nixpkgs", permission: ASKED_WAITING, gaps: [] },
  { id: "deb-mint", label: "Linux Mint", permission: ASKED_WAITING, gaps: [] },
  {
    id: "deb-popos",
    label: "Pop!_OS",
    permission: "Asked on 2026-11-09 in a public GitHub issue; waiting for an answer.",
    gaps: [],
  },
  { id: "deb-deepin", label: "Deepin", permission: ASKED_WAITING, gaps: [] },
  {
    id: "ebuild-gentoo",
    label: "Gentoo",
    permission: "Asked on 2026-11-09. Gentoo answered that our use is fine, under the GPL-2.",
    gaps: [],
  },
  {
    id: "odrs",
    label: "ODRS (ratings)",
    permission: "Asked on 2026-11-09. Its maintainer answered that our use is fine.",
    gaps: [],
  },
];

/** Every gap that is ours to build, with its source — for /docs/contribute/ and the page's own summary. */
export function todoGaps(): { source: string; gap: SourceGap }[] {
  return SOURCE_GAPS.flatMap((entry) =>
    entry.gaps.filter((gap) => gap.reason === "todo").map((gap) => ({ source: entry.label, gap })),
  );
}

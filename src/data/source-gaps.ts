import type { PackageSourceId } from "~/catalog-types";

// What Tuxery gets from each source, field by field, and why a field is
// missing when it is — kept by hand, like /docs/sources/'s METHODS, from
// tuxery/catalog: which fields each connector sets (`src/sources/*/
// normalize.ts`, a distro's AppStream connector counted with the distro),
// config/source-terms.json (permissions and answers) and docs/sources.md.
// Rendered by /docs/source-gaps/; the "todo" cells are what
// /docs/contribute/ points contributors to.

/** One cell of the table. Anything not listed for a source is `"none"`. */
export type Availability =
  | "yes"
  | "none"
  | "refused"
  | "waiting"
  | "todo"
  | "kept-private"
  | "not-applicable";

export const AVAILABILITY: Record<Availability, { label: string; description: string }> = {
  yes: { label: "Available", description: "Tuxery gets it from this source." },
  none: {
    label: "Not available",
    description: "The source doesn't publish it, or not in a form Tuxery reads.",
  },
  refused: {
    label: "Refused",
    description: "The source publishes it, but asked us not to collect it.",
  },
  waiting: {
    label: "Waiting",
    description: "The source is working on it, or we've asked and wait for an answer.",
  },
  todo: {
    label: "Not built yet",
    description: "Available and allowed; nobody has built it yet. Help welcome.",
  },
  "kept-private": {
    label: "Kept private",
    description:
      "Shown on Tuxery, but left out of the open-data downloads, by the source's request or our own caution.",
  },
  "not-applicable": {
    label: "n/a",
    description: "Doesn't apply to this source.",
  },
};

/** Each column: a short header, and what it means (the header's tooltip and the legend). */
export const FIELDS = {
  icon: { short: "Icon", long: "App icon" },
  screenshots: { short: "Shots", long: "Screenshots" },
  description: { short: "About", long: "Long description" },
  rating: { short: "Ratings", long: "User ratings" },
  popularity: { short: "Popular", long: "Popularity or install figures" },
  releaseDate: { short: "Dates", long: "Release or upload dates" },
  size: { short: "Size", long: "Download or installed size" },
  openData: { short: "Open data", long: "In the open-data downloads" },
} as const;

export type Field = keyof typeof FIELDS;

/** Where we stand with the source's maintainers about using their data. */
export type Permission = "agreed" | "limited" | "asked" | "not-asked" | "not-needed";

export const PERMISSIONS: Record<Permission, string> = {
  agreed: "Agreed",
  limited: "Agreed, with limits",
  asked: "Asked, waiting",
  "not-asked": "Not asked yet",
  "not-needed": "Not needed",
};

export interface SourceNote {
  /** The field or topic the note explains. */
  what: string;
  availability: Availability;
  /** One or two sentences, in plain words. */
  note: string;
}

export interface SourceRow {
  id: PackageSourceId;
  permission: Permission;
  /** The permission's specifics, when there are any: who answered, when, on what terms. */
  permissionNote?: string;
  /** Fields this source fills or explains; every other field is `"none"`. */
  fields: Partial<Record<Field, Availability>>;
  notes?: SourceNote[];
}

/** AppStream metadata, as the distros publish it alongside their package index. */
const APPSTREAM = { icon: "yes", screenshots: "yes", description: "yes" } as const;

const API_REFUSED =
  "Only published through Flathub's API, which Flathub asked us not to scrape (2026-11-10).";

export const SOURCE_ROWS: SourceRow[] = [
  {
    id: "flatpak-flathub",
    permission: "limited",
    permissionNote:
      "Flathub answered our question (2026-11-10): read the AppStream file it publishes for software centers, not its API.",
    fields: {
      ...APPSTREAM,
      rating: "yes",
      popularity: "refused",
      releaseDate: "yes",
      size: "refused",
      openData: "kept-private",
    },
    notes: [
      {
        what: "Install counts and Popular list",
        availability: "refused",
        note: `${API_REFUSED} This is why Tuxery has no download counts.`,
      },
      {
        what: "Download size and sandbox permissions",
        availability: "refused",
        note: API_REFUSED,
      },
      {
        what: "Ratings",
        availability: "yes",
        note: "From GNOME's ODRS, not from Flathub. Its maintainer agreed to our use.",
      },
      {
        what: "Open data",
        availability: "kept-private",
        note: "Flathub didn't say whether a public copy of its AppStream data is fine, and its site terms forbid copying any part of its service.",
      },
    ],
  },
  {
    id: "flatpak-appcenter",
    permission: "asked",
    fields: { ...APPSTREAM, rating: "yes", releaseDate: "yes" },
  },
  {
    id: "snap-snapcraft",
    permission: "not-asked",
    fields: { ...APPSTREAM, releaseDate: "yes" },
    notes: [
      {
        what: "Ratings and install counts",
        availability: "none",
        note: "The Snap Store shows neither publicly, so Snap-only apps can't appear in trending lists.",
      },
      {
        what: "Release date",
        availability: "yes",
        note: "The date each channel's revision was released to the store.",
      },
    ],
  },
  {
    id: "appimage",
    permission: "asked",
    fields: { icon: "yes", screenshots: "yes" },
  },
  {
    id: "appimage-manual",
    permission: "not-needed",
    permissionNote:
      "Our own hand-kept list of apps with no other source, linking to each project's own download.",
    fields: { icon: "yes", screenshots: "yes" },
  },
  {
    id: "appimagehub",
    // Its conditions (private copy, a link to its page) cost visitors nothing.
    permission: "agreed",
    permissionNote:
      "opendesktop.org allowed a weekly read on 2026-10-20, extended on 2026-11-10 to descriptions and preview images, on conditions (see Open data).",
    fields: { icon: "waiting", screenshots: "yes", description: "yes", openData: "kept-private" },
    notes: [
      {
        what: "Icon and license",
        availability: "waiting",
        note: "Their API doesn't expose them yet; opendesktop.org is working on it. Meanwhile the first preview image, usually the icon, stands in.",
      },
      {
        what: "Open data",
        availability: "kept-private",
        note: "opendesktop.org's condition: the texts are written by its uploaders and may not be redistributed.",
      },
    ],
  },
  {
    id: "deb-debian",
    permission: "agreed",
    permissionNote:
      "A Debian Developer answered on debian-legal (2026-11-10): no one would mind, and it would likely be fair use anyway. His own view, not an official Debian position.",
    fields: { ...APPSTREAM, popularity: "yes", size: "yes" },
  },
  { id: "deb-ubuntu", permission: "not-asked", fields: { ...APPSTREAM, size: "yes" } },
  { id: "deb-mint", permission: "asked", fields: {} },
  { id: "deb-popos", permission: "asked", fields: {} },
  { id: "deb-deepin", permission: "asked", fields: {} },
  { id: "deb-mxlinux", permission: "asked", fields: {} },
  {
    id: "rpm-fedora",
    permission: "asked",
    fields: { ...APPSTREAM, releaseDate: "yes", size: "yes" },
  },
  {
    id: "rpm-opensuse",
    permission: "asked",
    fields: { ...APPSTREAM, releaseDate: "yes", size: "yes" },
  },
  { id: "rpm-rpmfusion", permission: "asked", fields: { size: "yes" } },
  {
    id: "pacman-arch",
    permission: "not-asked",
    fields: { ...APPSTREAM, popularity: "yes", releaseDate: "yes", size: "yes" },
  },
  { id: "pacman-aur", permission: "not-asked", fields: { popularity: "yes" } },
  { id: "nix-nixpkgs", permission: "asked", fields: { description: "yes" } },
  { id: "apk-alpine", permission: "asked", fields: { size: "yes" } },
  { id: "xbps-void", permission: "asked", fields: { size: "yes" } },
  { id: "slackware", permission: "asked", fields: {} },
  {
    id: "eopkg-solus",
    permission: "agreed",
    permissionNote:
      "Solus's maintainers answered (2026-11-10): once a week is fine, and we now read its stable repository (Polaris), as they advised.",
    fields: { size: "yes" },
    notes: [
      {
        what: "License of the data",
        availability: "waiting",
        note: "The repository has no clear license yet; Solus is working on it.",
      },
    ],
  },
  {
    id: "ebuild-gentoo",
    permission: "agreed",
    permissionNote: "Gentoo answered that our use is fine, under the GPL-2 (2026-11-10).",
    fields: {},
  },
  {
    id: "gog",
    permission: "asked",
    fields: {
      icon: "yes",
      screenshots: "yes",
      description: "yes",
      rating: "yes",
      popularity: "yes",
      openData: "kept-private",
    },
    permissionNote:
      "GOG's User Agreement (§11.1(e)) forbids extraction tools that collect information about GOG services. We've paused reading GOG and asked GOG for permission (2026-11-10).",
    notes: [
      {
        what: "Updates",
        availability: "refused",
        note: "Paused: GOG games stay listed as of 2026-11-07, with their link to GOG, but new games and changes don't come in until GOG answers.",
      },
      {
        what: "Open data",
        availability: "kept-private",
        note: "GOG's terms reserve its catalog data and texts.",
      },
    ],
  },
  {
    id: "lutris",
    permission: "agreed",
    permissionNote:
      "Lutris's founder answered (2026-11-10): reading its API is fine. Its genres come partly from IGDB, one of several import channels.",
    fields: { icon: "yes", description: "yes" },
  },
  {
    id: "github-releases",
    permission: "not-needed",
    permissionNote:
      "GitHub's terms cover reading its API and public repositories, so we haven't asked.",
    fields: { popularity: "yes", releaseDate: "yes" },
  },
  { id: "vendor-repos", permission: "not-asked", fields: {} },
];

/** A cell's value: open data is available unless said otherwise, everything else isn't. */
export function cellOf(row: SourceRow, field: Field): Availability {
  return row.fields[field] ?? (field === "openData" ? "yes" : "none");
}

/** Every note marked "todo", with its source id — for /docs/contribute/ and the page's own summary. */
export function todoNotes(): { id: PackageSourceId; note: SourceNote }[] {
  return SOURCE_ROWS.flatMap((row) =>
    (row.notes ?? [])
      .filter((note) => note.availability === "todo")
      .map((note) => ({ id: row.id, note })),
  );
}

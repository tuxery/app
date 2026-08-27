// Client-safe half of the catalog layer: pure types/constants only, no
// `@libsql/client` import. Components rendered on the client must import
// from here, never from `~/catalog` — that file's top-level `createClient`
// import drags the Node-only libsql driver into the client bundle, which
// breaks `pnpm build`.
//
// Mirrors `tuxery/catalog`'s dataset shape (packages/sources/src/types.ts,
// packages/curator/src/enrich/types.ts, packages/store/src/turso-client.ts's
// `apps` table). No cross-repo import (separate repos, not a monorepo), so
// this is kept in sync by hand.

// One id per connector folder under catalog's packages/sources/src/ —
// `<format>-<provider>` (e.g. "deb-debian"), except appimage/slackware/
// gog/lutris, which keep a bare name (single format+provider today, or,
// for gog/lutris, no package format at all). `appimage-manual` is a
// deliberate exception: the original `appimage` keeps its historical bare
// name instead of becoming `appimage-github` now that a second AppImage
// source exists.
export type PackageSourceId =
  | "flatpak-flathub"
  | "flatpak-appcenter"
  | "snap-snapcraft"
  | "appimage"
  | "appimage-manual"
  | "pacman-aur"
  | "deb-debian"
  | "deb-ubuntu"
  | "rpm-fedora"
  | "pacman-arch"
  | "nix-nixpkgs"
  | "rpm-opensuse"
  | "rpm-rpmfusion"
  | "apk-alpine"
  | "xbps-void"
  | "slackware"
  | "eopkg-solus"
  | "ebuild-gentoo"
  | "deb-mint"
  | "deb-popos"
  | "deb-deepin"
  | "deb-mxlinux"
  | "gog"
  | "lutris"
  | "github-releases";

export const SOURCE_LABELS: Record<PackageSourceId, string> = {
  "flatpak-flathub": "Flathub (Flatpak)",
  "flatpak-appcenter": "elementary AppCenter (Flatpak)",
  "snap-snapcraft": "Snap Store",
  appimage: "AppImage",
  "appimage-manual": "AppImage (direct download)",
  "pacman-aur": "AUR",
  "deb-debian": "Debian",
  "deb-ubuntu": "Ubuntu",
  "rpm-fedora": "Fedora",
  "pacman-arch": "Arch Linux",
  "nix-nixpkgs": "Nixpkgs",
  "rpm-opensuse": "openSUSE",
  "rpm-rpmfusion": "RPM Fusion",
  "apk-alpine": "Alpine Linux",
  "xbps-void": "Void Linux",
  slackware: "Slackware",
  "eopkg-solus": "Solus",
  "ebuild-gentoo": "Gentoo",
  "deb-mint": "Linux Mint",
  "deb-popos": "Pop!_OS",
  "deb-deepin": "Deepin",
  "deb-mxlinux": "MX Linux",
  gog: "GOG",
  lutris: "Lutris",
  "github-releases": "GitHub Releases",
};

/** Every known source, in a fixed order. Derived from `SOURCE_LABELS` so it can never drift out of sync with `PackageSourceId`. */
export const ALL_PACKAGE_SOURCE_IDS = Object.keys(SOURCE_LABELS) as PackageSourceId[];

/**
 * A platform/distro identity, one step coarser than `PackageSourceId` —
 * "Flatpak" regardless of remote (Flathub vs. elementary AppCenter),
 * "AppImage" regardless of feed (community vs. the hand-curated manual
 * seed), "Arch Linux" regardless of repo (AUR vs. official core/extra),
 * "Fedora" including its RPM Fusion addon repo. Everything else is
 * already one source per platform, so it's a 1:1 passthrough. Powers the
 * app-card dot-map (`components/app-card`) — one square per platform a
 * user would actually think of as distinct, not one per packaging
 * backend variant.
 */
export const SOURCE_GROUP_MEMBERS: Record<string, PackageSourceId[]> = {
  Flatpak: ["flatpak-flathub", "flatpak-appcenter"],
  Snap: ["snap-snapcraft"],
  AppImage: ["appimage", "appimage-manual"],
  "Arch Linux": ["pacman-aur", "pacman-arch"],
  Debian: ["deb-debian"],
  Ubuntu: ["deb-ubuntu"],
  Fedora: ["rpm-fedora", "rpm-rpmfusion"],
  openSUSE: ["rpm-opensuse"],
  "Alpine Linux": ["apk-alpine"],
  "Void Linux": ["xbps-void"],
  Slackware: ["slackware"],
  Solus: ["eopkg-solus"],
  Gentoo: ["ebuild-gentoo"],
  Nixpkgs: ["nix-nixpkgs"],
  "Linux Mint": ["deb-mint"],
  "Pop!_OS": ["deb-popos"],
  Deepin: ["deb-deepin"],
  "MX Linux": ["deb-mxlinux"],
  GOG: ["gog"],
  Lutris: ["lutris"],
  "GitHub Releases": ["github-releases"],
};

/** Every source group, in a fixed order — see `SOURCE_GROUP_MEMBERS`. */
export const ALL_SOURCE_GROUPS = Object.keys(SOURCE_GROUP_MEMBERS);

export interface SourcedPackage {
  source: PackageSourceId;
  name: string;
  description: string;
  version: string;
  appId?: string;
  iconFilename?: string;
  channel?: string;
  homepage?: string;
  /** A crowd rating from this specific source, when it has one — see `tuxery/catalog`'s `SourcedPackage.rating` doc comment for which sources populate this. */
  rating?: { average: number; count: number };
}

export interface CatalogApp {
  id: string;
  name: string;
  shortDescription: string;
  homepage?: string;
  packages: SourcedPackage[];
  /** "gui" when the catalog has positive evidence of a launchable GUI app — never "cli" by default, see `tuxery/catalog`'s `CatalogApp.kind` doc comment. */
  kind?: "gui";
  /** "game" when the catalog has positive evidence of being a game — never assumed "app" by default, see `tuxery/catalog`'s `CatalogApp.contentType` doc comment. */
  contentType?: "game";
  iconUrl?: string;
  longDescription?: string;
  /** Always a real label, "To Classify" at worst — see `tuxery/catalog`'s `CatalogApp.category` doc comment. */
  category: string;
  developer?: string;
  publisher?: string;
  license?: string;
  languages?: string[];
  approxSizeBytes?: number;
  screenshots?: string[];
  videos?: string[];
  rating?: { average: number; count: number };
  /** Trending/popularity signal (0-1), when at least one source has one — see `tuxery/catalog`'s `CatalogApp.popularity` doc comment. */
  popularity?: number;
  reviews?: Array<{ author: string; text: string; rating: number }>;
  features?: string[];
  changelog?: string;
  requirements?: string;
  permissions?: string[];
  ageRating?: { system: string; value: string };
  aiFeatures?: boolean;
  inAppPurchases?: boolean;
  gdprCompliant?: boolean;
  editorialTags?: string[];
  /** Software-suite membership — see `tuxery/catalog`'s `CatalogApp.suite` doc comment. */
  suite?: {
    id: string;
    name: string;
    role: "main" | "component";
    components?: { id: string; name: string }[];
    mainApp?: { id: string; name: string };
  };
  /** Known packaging-format compatibility issues, each scoped to the specific `source` (a `PackageSourceId`) it affects — see `tuxery/catalog`'s `CatalogApp.compatibilityWarnings` doc comment. Rendered inline next to that source's row in the install drawer, not as a separate app-level banner. */
  compatibilityWarnings?: {
    source: PackageSourceId;
    severity: "warning" | "info";
    issue: string;
    fix?: string;
  }[];
}

/** Human label for a build channel — `undefined` is the default/stable build, everything else (AUR's git/svn/hg/bzr/cvs/bin) gets its raw value capitalized. */
export function channelLabel(channel: string | undefined): string {
  if (!channel) return "Stable";
  return channel.charAt(0).toUpperCase() + channel.slice(1);
}

/** Every channel word present across a set of packages, deduplicated — the "channels: ..." line in `SourceSummary`'s tooltip, on both a `CatalogApp`'s full `packages` and an `AppSummary`'s already-summarized `channels`. */
export function summarizeChannels(packages: { channel?: string }[]): string[] {
  return [...new Set(packages.map((pkg) => channelLabel(pkg.channel)))];
}

/** Human label for a package's own source, e.g. "Flathub (Flatpak)", or "AUR (git build)" for a non-default channel. */
export function formatSourceLabel(pkg: { source: PackageSourceId; channel?: string }): string {
  const label = SOURCE_LABELS[pkg.source];
  return pkg.channel ? `${label} (${pkg.channel} build)` : label;
}

export interface SourceRating {
  label: string;
  average: number;
  count: number;
}

/** One row per package that carries its own crowd rating, formatted for `UnifiedRating`'s per-source breakdown — on both a `CatalogApp`'s full `packages` and (via `AppSummary.ratingsBySource`) an already-summarized listing row. */
export function summarizeRatingsBySource(packages: SourcedPackage[]): SourceRating[] {
  return packages
    .filter((pkg): pkg is SourcedPackage & { rating: { average: number; count: number } } =>
      Boolean(pkg.rating),
    )
    .map((pkg) => ({
      label: formatSourceLabel(pkg),
      average: pkg.rating.average,
      count: pkg.rating.count,
    }));
}

/**
 * The subset of `CatalogApp` a search result card needs — cheap to select
 * and stream in bulk, unlike the full row. `sources` is deduplicated by
 * source id (a merged app can carry two packages from the same source,
 * e.g. AUR's official + `-git` build); `packageCount`/`channels` describe
 * the same underlying `packages` list `sources` was derived from — not
 * derivable from `sources` alone, so carried separately for
 * `ChannelIndicator`'s package-count badge and channels tooltip.
 * `ratingsBySource` is the same "per-package breakdown" data
 * `UnifiedRating`'s tooltip needs — free to derive from `packages_json`,
 * already selected for `sources`/`channels` above.
 */
export interface AppSummary {
  id: string;
  name: string;
  shortDescription: string;
  iconUrl?: string;
  kind?: "gui";
  contentType?: "game";
  /** Always a real label, "To Classify" at worst — see `tuxery/catalog`'s `CatalogApp.category` doc comment. */
  category: string;
  rating?: { average: number; count: number };
  ratingsBySource: SourceRating[];
  sources: PackageSourceId[];
  packageCount: number;
  channels: string[];
}

export interface CatalogStats {
  total: number;
  generatedAt: string;
}

export const EMPTY_STATS: CatalogStats = { total: 0, generatedAt: "" };

export const BROWSE_PAGE_SIZE = 30;

export interface BrowseResult {
  apps: AppSummary[];
  total: number;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

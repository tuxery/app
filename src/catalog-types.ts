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
  | "lutris";

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
  category?: string;
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

/** The subset of `CatalogApp` a search result card needs — cheap to select and stream in bulk, unlike the full row. */
export interface AppSummary {
  id: string;
  name: string;
  shortDescription: string;
  iconUrl?: string;
  kind?: "gui";
  contentType?: "game";
  category?: string;
  rating?: { average: number; count: number };
  sources: PackageSourceId[];
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

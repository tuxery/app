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

import { unique } from "helpers4/array";
import { formatSize } from "helpers4/number";
import { capitalize } from "helpers4/string";

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
  | "github-releases"
  | "vendor-repos";

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
  "vendor-repos": "Vendor apt repository",
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
  /** The product's parallel line this package belongs to (`esr`, `devedition`, `17`) — see catalog's docs/product-families.md. Absent: the default line. */
  track?: string;
  /** How mature this build is. Absent: stable. */
  risk?: Risk;
  /** Technical variants of the same release (`bin`, `appimage`, a patch set, `locale:de`, a Lutris installer label). */
  flavors?: string[];
  /** Who built the binaries — a trust hint, never a choice. Absent: unknown. */
  provenance?: Provenance;
  /** Datasets published before product families carried one overloaded word here instead of `track`/`risk`/`flavors` — still read so an older dataset keeps rendering. */
  channel?: string;
  homepage?: string;
  /** The license as this source publishes it — the docs' per-source comparison shows it next to the merged one. */
  license?: string;
  /** This listing's own download size and newest changelog, when its source has them (Flathub today) — see `buildFacts`. */
  approxSizeBytes?: number;
  changelog?: string;
  /** A crowd rating from this specific source, when it has one — see `tuxery/catalog`'s `SourcedPackage.rating` doc comment for which sources populate this. */
  rating?: { average: number; count: number };
  /** Upstream store collections this specific package appears in — see `tuxery/catalog`'s `SourcedPackage.storeCollections` doc comment. Today only Flathub populates `"verified"` (developer-identity-verified) here; no other source has an equivalent signal. */
  storeCollections?: string[];
}

export type Risk = "candidate" | "beta" | "nightly" | "git";

export type Provenance = "upstream" | "distro" | "community-repack" | "community-patched";

export type CompanionKind =
  | "extension"
  | "plugin"
  | "theme"
  | "localization"
  | "data"
  | "native-host"
  | "config"
  /** A separately packaged part of the product itself (its -data, -server or -relay package). */
  | "component";

/** Something that adds to a product (extension, plugin, theme, language pack, ...) — listed on its page, never a card of its own. */
export interface Companion {
  name: string;
  kind: CompanionKind;
  description: string;
  packages: { source: PackageSourceId; name: string }[];
}

export type RelationType = "forkOf" | "replaces" | "wrapperOf" | "partOf" | "toolFor";

/** A link to another product, from this product's side: `outgoing` reads "this <type> app", `incoming` "app <type> this". */
export interface Relation {
  type: RelationType;
  direction: "outgoing" | "incoming";
  app: { id: string; name: string };
  origin: "formal" | "curated";
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
  /** Date of the newest release the app's AppStream metadata lists (Flathub and AppCenter only today) — see `tuxery/catalog`'s `CatalogApp.lastUpdated`. */
  lastUpdated?: string;
  /** Flathub's own install counts — all time and the last 7 days — for the app's Flathub package only, never all Linux users. */
  installsTotal?: number;
  installsLast7Days?: number;
  /** Deterministic signals on how far the sources agree (corroboration, name or license disagreement, a hand-checked match) — see `tuxery/catalog`'s `CatalogApp.dataConfidence`. Absent on a dataset published before it existed. */
  dataConfidence?: import("~/app-facts").DataConfidence;
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
  /** Upstream store collections this app appears in (Flathub's verified/recently-added/recently-updated, Snapcraft's featured) — see `tuxery/catalog`'s `CatalogApp.storeCollections` doc comment. Distinct from `editorialTags` above (Tuxery's own manual curation). */
  storeCollections?: string[];
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
  /** At most 100 per kind — `companionCounts` has the full numbers. */
  companions?: Companion[];
  companionCounts?: Partial<Record<CompanionKind, number>>;
  relations?: Relation[];
}

const RISK_LABELS: Record<Risk, string> = {
  candidate: "Candidate",
  beta: "Beta",
  nightly: "Nightly",
  git: "Git",
};

const TRACK_LABELS: Record<string, string> = {
  esr: "ESR",
  lts: "LTS",
  devedition: "Developer Edition",
};

const FLAVOR_LABELS: Record<string, string> = { appimage: "AppImage" };

function flavorLabel(flavor: string): string {
  if (flavor.startsWith("locale:")) return flavor.slice("locale:".length);
  return FLAVOR_LABELS[flavor] ?? capitalize(flavor, { lowercaseRest: false });
}

/** Display name of a track ("ESR", "Developer Edition", "LTS-22"); the default track is "Standard". */
export function trackLabel(track: string | undefined): string {
  if (!track) return "Standard";
  return TRACK_LABELS[track] ?? capitalize(track, { lowercaseRest: false });
}

/** Display name of a risk; no risk is "Stable". */
export function riskLabel(risk: Risk | undefined): string {
  return risk ? RISK_LABELS[risk] : "Stable";
}

type BuildFields = Pick<SourcedPackage, "track" | "risk" | "flavors" | "channel">;

/** Whether a package is its product's default build: default track, stable, no flavor (or, on an older dataset, no channel / "stable"). */
export function isDefaultBuild(pkg: BuildFields): boolean {
  if (pkg.track || pkg.risk || pkg.flavors?.length) return false;
  return !pkg.channel || pkg.channel.toLowerCase() === "stable";
}

/**
 * Human label for one build of a product — its track, risk and flavors
 * ("ESR · Bin", "Nightly", "Vaapi"), or "Stable" for the default build.
 * Reads an older dataset's single `channel` word the way it always did.
 */
export function buildLabel(pkg: BuildFields): string {
  if (isDefaultBuild(pkg)) return "Stable";
  if (!pkg.track && !pkg.risk && !pkg.flavors?.length) {
    return capitalize(pkg.channel ?? "", { lowercaseRest: false });
  }
  return [
    pkg.track ? trackLabel(pkg.track) : "",
    pkg.risk ? riskLabel(pkg.risk) : "",
    ...(pkg.flavors ?? []).map(flavorLabel),
  ]
    .filter(Boolean)
    .join(" · ");
}

const PROVENANCE_LABELS: Record<Provenance, string> = {
  upstream: "Official build",
  distro: "Distribution build",
  "community-repack": "Community repack",
  "community-patched": "Community build, patched",
};

const PROVENANCE_TIPS: Record<Provenance, string> = {
  upstream: "Built by the project itself",
  distro: "Rebuilt from source by the distribution",
  "community-repack": "The project's own binaries, repackaged by a community maintainer",
  "community-patched": "Built by a community maintainer with extra patches",
};

/** Short label and longer explanation for who built a package, when known. */
export function provenanceInfo(
  provenance: Provenance | undefined,
): { label: string; tip: string } | undefined {
  return provenance
    ? { label: PROVENANCE_LABELS[provenance], tip: PROVENANCE_TIPS[provenance] }
    : undefined;
}

/** Whether this specific package is from a developer-identity-verified listing — today only ever true for a `flatpak-flathub` package carrying Flathub's own "verified" collection tag. */
export function isVerifiedPackage(pkg: { storeCollections?: string[] }): boolean {
  return pkg.storeCollections?.includes("verified") ?? false;
}

/** Every distinct source with at least one verified package — see `isVerifiedPackage`. Used both server-side (`AppSummary.verifiedSources`) and client-side (the detail page, from its own full `packages`). */
export function verifiedSourcesOf(
  packages: { source: PackageSourceId; storeCollections?: string[] }[],
): PackageSourceId[] {
  return unique(packages.filter(isVerifiedPackage).map((pkg) => pkg.source));
}

/** An app's release lines as the product page names them: each edition (catalog's tracks) with its own versions (risks), and the other builds (flavors) — see docs/product-families.md and the glossary. */
export interface ReleaseLines {
  editions: { name: string; versions: string[] }[];
  otherBuilds: string[];
}

/** `ReleaseLines` from a set of packages, each list deduplicated, labels as the pickers show them ("Standard", "ESR"; "Stable", "Nightly"; "Bin", "AppImage"). */
export function summarizeReleaseLines(packages: BuildFields[]): ReleaseLines {
  return {
    editions: unique(packages.map((pkg) => trackLabel(pkg.track))).map((name) => ({
      name,
      versions: unique(
        packages.filter((pkg) => trackLabel(pkg.track) === name).map((pkg) => riskLabel(pkg.risk)),
      ),
    })),
    otherBuilds: unique(
      packages.flatMap((pkg) => (pkg.flavors ?? []).map((flavor) => flavorLabel(flavor))),
    ),
  };
}

/** Every distinct build across a set of packages (see `buildLabel`) — `BuildCount`'s tooltip, on both a `CatalogApp`'s full `packages` and an `AppSummary`'s already-summarized `builds`. Deduplicated: an app with a dozen native-distro packages, all the default build, has exactly one entry here. */
export function summarizeBuilds(packages: BuildFields[]): string[] {
  return unique(packages.map(buildLabel));
}

/**
 * Whether a package comes from a source you install from. The catalog also
 * ships packages from sources that only add metadata to apps listed
 * elsewhere — the distributions' AppStream files (`deb-debian-appstream`,
 * `rpm-fedora-appstream`, ...) — which have no `SOURCE_LABELS` entry and
 * must not be listed as a way to get the app (they rendered as empty
 * items in "Available via").
 */
export function isInstallSource(source: string): source is PackageSourceId {
  return Object.hasOwn(SOURCE_LABELS, source);
}

/** Every distinct way to get an app, as labels ("Flathub (Flatpak)", "AUR (Git build)"), in first-seen order — one per source and build, however many packages share it (Nixpkgs ships several attribute paths of one build), metadata-only sources left out. */
export function availableViaLabels(
  packages: ({ source: PackageSourceId } & BuildFields)[],
): string[] {
  return unique(packages.filter((pkg) => isInstallSource(pkg.source)).map(formatSourceLabel));
}

/** Human label for a package's own source, e.g. "Flathub (Flatpak)", or "AUR (Git build)" for a build other than the default one. */
export function formatSourceLabel(pkg: { source: PackageSourceId } & BuildFields): string {
  const label = SOURCE_LABELS[pkg.source];
  return isDefaultBuild(pkg) ? label : `${label} (${buildLabel(pkg)} build)`;
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
 * e.g. AUR's official + `-git` build); `builds` describes the distinct
 * builds across that same underlying `packages` list — not derivable
 * from `sources` alone, so carried separately for `BuildCount`'s
 * badge/tooltip. `ratingsBySource` is the same "per-package breakdown"
 * data `UnifiedRating`'s tooltip needs — free to derive from
 * `packages_json`, already selected for `sources`/`builds` above.
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
  builds: string[];
  /** Editions, versions and other builds, for `BuildCount` — see `summarizeReleaseLines`. */
  releaseLines: ReleaseLines;
  /** Which of `sources` has at least one verified package — see `verifiedSourcesOf`. Almost always `[]` or `["flatpak-flathub"]` today, no other source has an equivalent signal. */
  verifiedSources: PackageSourceId[];
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
  /** `total` is a lower bound: a free-text search stops counting past it, so there are more matches than that (shown as "1,000+"). */
  totalCapped?: boolean;
}

export function formatBytes(bytes: number): string {
  return formatSize(bytes, { unitSeparator: " ", integerBelowFirstUnit: true });
}

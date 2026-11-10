import type { PackageSourceId } from "~/catalog-types";

// Mirrors tuxery/catalog's docs/sources.md — kept in sync by hand, no
// cross-repo import (separate repos). One line per source: how Tuxery
// actually retrieves its listing.
export const METHODS: Record<PackageSourceId, string> = {
  "flatpak-flathub": "Flathub's own appstream repodata feeds, stable and beta.",
  "flatpak-appcenter": "elementary's own Flatpak remote, same appstream format as Flathub.",
  "snap-snapcraft":
    "Snapcraft's search API, read page by page, each snap's channels asked for when it changes or at least every four weeks.",
  appimage: "appimage.github.io's community-curated feed, cross-checked against GitHub Releases.",
  "appimage-manual": "A small hand-curated list for apps with no GitHub repo and no other source.",
  appimagehub:
    "AppImageHub's OCS API, swept once a week with opendesktop.org's permission. Not redistributed (see Open data); every app links to its AppImageHub page.",
  "pacman-aur": "Arch User Repository's full metadata dump.",
  "pacman-arch": "Arch's official core/extra/multilib repos.",
  "deb-debian": "Debian stable's own Packages index.",
  "deb-ubuntu": "The current Ubuntu release's own Packages index.",
  "deb-mint": "Linux Mint's own package index, scoped to Mint's own software.",
  "deb-popos": "Pop!_OS's own package index, scoped to System76's own software.",
  "deb-deepin": "Deepin's own package index, scoped to Deepin's own software.",
  "deb-mxlinux": "MX Linux's own package index, scoped to the MX tools.",
  "rpm-fedora": "The current Fedora release's Everything + updates repodata.",
  "rpm-opensuse": "openSUSE Tumbleweed's and Leap 16.0's oss/non-oss repodata.",
  "rpm-rpmfusion": "RPM Fusion's free + nonfree repodata, addon repos for Fedora.",
  "nix-nixpkgs": "The Nixpkgs package set: nixos-unstable and the latest stable channel.",
  "apk-alpine": "Alpine's APKINDEX (latest stable).",
  "xbps-void": "Void's own package index.",
  slackware: "Slackware's own package trees, -current and the 15.0 release.",
  "eopkg-solus": "Solus's own eopkg repository.",
  "ebuild-gentoo": "The Gentoo Portage tree.",
  gog: "GOG's own catalog API, scoped to Linux-compatible titles. Not redistributed, as our own precaution rather than at GOG's request (see Open data).",
  lutris: "Lutris's installer API, scoped to native Linux installers.",
  "github-releases": 'GitHub repositories tagged "linux-app" that publish a real tagged release.',
  "vendor-repos":
    "A hand-curated list of first-party vendor apt repos (Brave, Chrome, VS Code, Firefox, Steam, Slack, ...), read from each vendor's own Packages index.",
};

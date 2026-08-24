import type { PackageSourceId, SourcedPackage } from "~/catalog-types";

/**
 * How to actually install from one source, per the "drawer should be
 * prettier and clearer, not just a button per source" ask. Two shapes:
 * - `"link"`: the source has a real web page that hands off to the
 *   local package manager on its own (Flathub's, GOG's, Lutris's own
 *   "Install"/"Download" button) — `pkg.homepage` is that page.
 * - `"command"`: no such page exists — every native distro package
 *   manager only ever installs from a terminal, there's no universal
 *   `apt://`-style link that reliably works across desktops/distros
 *   today, so a copy-paste command is the honest, always-correct
 *   option instead of a button that might silently do nothing.
 *
 * `setup`, when present, is a one-time step needed before the source is
 * usable at all (adding a Flatpak remote, installing an AUR helper,
 * installing snapd) — distinct from installing this one app. Paired
 * with `settings.ts`'s per-leaf `activated` flag: once a user confirms
 * they've done it, the drawer stops showing it for every app.
 */
export interface InstallMethod {
  kind: "link" | "command";
  command?: (pkg: SourcedPackage) => string;
  setup?: { command: string; note: string };
}

const FLATHUB_SETUP = {
  command:
    "flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo",
  note: "One-time — adds the Flathub remote to Flatpak.",
};

export const INSTALL_METHODS: Record<PackageSourceId, InstallMethod> = {
  "flatpak-flathub": { kind: "link", setup: FLATHUB_SETUP },
  "flatpak-appcenter": {
    kind: "link",
    setup: {
      command:
        "flatpak remote-add --if-not-exists appcenter https://flatpak.elementary.io/repo.flatpakrepo",
      note: "One-time — adds elementary's own Flatpak remote.",
    },
  },
  "snap-snapcraft": {
    kind: "command",
    command: (pkg) => `sudo snap install ${pkg.name}`,
    setup: {
      command: "sudo apt install snapd",
      note: "One-time — installs snapd if it isn't already (pre-installed on Ubuntu).",
    },
  },
  appimage: { kind: "link" },
  "appimage-manual": { kind: "link" },
  "pacman-aur": {
    kind: "command",
    command: (pkg) => `yay -S ${pkg.name}`,
    setup: {
      command: "# install an AUR helper first, e.g.: https://github.com/Jguer/yay#installation",
      note: "One-time — the AUR itself needs a helper (yay, paru, ...), pacman alone can't reach it.",
    },
  },
  "pacman-arch": { kind: "command", command: (pkg) => `sudo pacman -S ${pkg.name}` },
  "deb-debian": { kind: "command", command: (pkg) => `sudo apt install ${pkg.name}` },
  "deb-ubuntu": { kind: "command", command: (pkg) => `sudo apt install ${pkg.name}` },
  "deb-mint": { kind: "command", command: (pkg) => `sudo apt install ${pkg.name}` },
  "deb-popos": { kind: "command", command: (pkg) => `sudo apt install ${pkg.name}` },
  "deb-deepin": { kind: "command", command: (pkg) => `sudo apt install ${pkg.name}` },
  "deb-mxlinux": { kind: "command", command: (pkg) => `sudo apt install ${pkg.name}` },
  "rpm-fedora": { kind: "command", command: (pkg) => `sudo dnf install ${pkg.name}` },
  "rpm-opensuse": { kind: "command", command: (pkg) => `sudo zypper install ${pkg.name}` },
  "rpm-rpmfusion": {
    kind: "command",
    command: (pkg) => `sudo dnf install ${pkg.name}`,
    setup: {
      command:
        "sudo dnf install https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm",
      note: "One-time — RPM Fusion is an addon repo, not enabled by default on Fedora.",
    },
  },
  "apk-alpine": { kind: "command", command: (pkg) => `sudo apk add ${pkg.name}` },
  "xbps-void": { kind: "command", command: (pkg) => `sudo xbps-install -S ${pkg.name}` },
  slackware: { kind: "command", command: (pkg) => `sudo slackpkg install ${pkg.name}` },
  "eopkg-solus": { kind: "command", command: (pkg) => `sudo eopkg install ${pkg.name}` },
  "ebuild-gentoo": { kind: "command", command: (pkg) => `sudo emerge ${pkg.name}` },
  "nix-nixpkgs": { kind: "command", command: (pkg) => `nix profile install nixpkgs#${pkg.name}` },
  gog: { kind: "link" },
  lutris: { kind: "link" },
};

export function installCommand(pkg: SourcedPackage): string | undefined {
  return INSTALL_METHODS[pkg.source]?.command?.(pkg);
}

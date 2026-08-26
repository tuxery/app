import type { PackageSourceId, SourcedPackage } from "~/catalog-types";

/**
 * A best-effort URI-scheme deep link that may trigger a local install
 * directly — real, verified schemes, but none of them reliably detectable
 * from a web page, so every one of these is a "try it" affordance, never
 * the only option (see `InstallMethod.command`/`websiteLink` for the
 * always-correct fallbacks alongside it).
 * - `appstream:<component-id>` — freedesktop.org's AppStream spec,
 *   handled by both GNOME Software and KDE Discover. Only meaningful
 *   where `pkg.appId` really is an AppStream component id (Flatpak) —
 *   native distro packages' `appId` is just the bare package name, which
 *   doesn't resolve, so this is Flatpak-only.
 * - `apt:<name>` — Debian/Ubuntu's own apturl convention, opens
 *   GNOME Software's package page. Verified real but genuinely narrow:
 *   Debian/Ubuntu + GNOME-Software specifically, nothing else — not
 *   extended to Debian-derivatives (Mint/Pop!_OS/Deepin/MX Linux) since
 *   none of them ship GNOME Software by default and apturl support on
 *   them isn't verified. No equivalent found for any other distro
 *   (Fedora/Arch/openSUSE/Alpine/...) despite checking — PackageKit's
 *   own URI-handler model that would have covered this is in
 *   maintenance mode, superseded by AppStream, which native distro
 *   packages here can't use either (see above).
 * - `snap:<name>` — real, still used by Snapcraft's own store today,
 *   but framed very differently: canonical/snapcraft.io's own install
 *   button (`static/js/public/snap-details/openDesktop.ts`) doesn't use
 *   a plain link at all — no reliable way to detect an unregistered
 *   handler, so a bare `<a href="snap://...">` click either works
 *   silently or fails silently with no visible feedback either way.
 *   They open it in a hidden iframe instead and use a blur/
 *   visibilitychange listener with a ~1.5s timeout to infer success
 *   (the OS switching away to launch the handler blurs the page) —
 *   `needsIframeDetection` marks this one entry as needing that same
 *   technique, ported in `SourceInstallUnit`, rather than a plain link.
 */
export interface DeepLink {
  url: (pkg: SourcedPackage) => string | undefined;
  needsIframeDetection?: boolean;
}

/**
 * How to actually install from one source, per the "drawer should be
 * prettier and clearer, not just a button per source" ask. `kind` mostly
 * just picks the *primary* framing (a "link" source's own page can hand
 * off to install on its own; a "command" source can't) — `deepLink`,
 * `command`, and `websiteLink` are independent and any combination may
 * be present, rendered in that fixed order: one-time `setup` first, then
 * `deepLink` (if real for this source), then `command` (the always-
 * correct fallback for "command"-kind sources, or an additional option
 * for "link"-kind ones where a real CLI equivalent exists, e.g.
 * `flatpak install`), then `websiteLink` last as the final fallback if
 * everything above needs a human to finish it by hand.
 *
 * `setup`, when present, is a one-time step needed before the source is
 * usable at all (adding a Flatpak remote, installing an AUR helper,
 * installing snapd, getting an AppImage desktop-integration tool) —
 * distinct from installing this one app. Paired with `settings.ts`'s
 * per-leaf `activated` flag: once a user confirms they've done it, the
 * drawer stops showing it for every app. Two shapes, same idea as
 * `InstallMethod.kind` itself: a `"command"` step is a single copy-paste
 * shell command; a `"link"` step hands off to an upstream page instead —
 * real bug, found live: snapd's install step used to hardcode
 * `sudo apt install snapd`, which is wrong on every distro that isn't
 * Debian/Ubuntu (Fedora/Arch/openSUSE/... all need a different command)
 * — Snapcraft's own install docs already cover every distro correctly,
 * so linking there is more honest than picking one distro's command and
 * calling it universal.
 */
export interface InstallMethod {
  kind: "link" | "command";
  deepLink?: DeepLink;
  command?: (pkg: SourcedPackage) => string;
  /** The page to hand off to when nothing more direct is available/worked — `pkg.homepage` (or the app's own homepage) by default; only overridden where a source-specific page is more useful (Snap's own Snapcraft Store listing beats a possibly-missing publisher homepage). */
  websiteLink?: (pkg: SourcedPackage) => string | undefined;
  setup?:
    | { kind: "command"; command: string; note: string }
    | { kind: "link"; url: string; note: string };
}

const FLATHUB_SETUP = {
  kind: "command" as const,
  command:
    "flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo",
  note: "One-time — adds the Flathub remote to Flatpak.",
};

const APPIMAGE_SETUP = {
  kind: "link" as const,
  url: "https://flathub.org/apps/it.mijorus.gearlever",
  note: "Most distros need a small helper to add AppImages to your app menu and keep them updated — Gear Lever (via Flatpak, so it works the same on any distro) is the actively maintained pick. Some setups already handle this on their own; skip it if yours does.",
};

export const INSTALL_METHODS: Record<PackageSourceId, InstallMethod> = {
  "flatpak-flathub": {
    kind: "link",
    deepLink: { url: (pkg) => (pkg.appId ? `appstream://${pkg.appId}` : undefined) },
    command: (pkg) => `flatpak install flathub ${pkg.appId}`,
    setup: FLATHUB_SETUP,
  },
  "flatpak-appcenter": {
    kind: "link",
    deepLink: { url: (pkg) => (pkg.appId ? `appstream://${pkg.appId}` : undefined) },
    command: (pkg) => `flatpak install appcenter ${pkg.appId}`,
    setup: {
      kind: "command",
      command:
        "flatpak remote-add --if-not-exists appcenter https://flatpak.elementary.io/repo.flatpakrepo",
      note: "One-time — adds elementary's own Flatpak remote.",
    },
  },
  "snap-snapcraft": {
    kind: "command",
    deepLink: {
      url: (pkg) => (pkg.appId ? `snap://${pkg.appId}` : undefined),
      needsIframeDetection: true,
    },
    command: (pkg) => `sudo snap install ${pkg.name}`,
    websiteLink: (pkg) => (pkg.appId ? `https://snapcraft.io/${pkg.appId}` : pkg.homepage),
    setup: {
      kind: "link",
      url: "https://snapcraft.io/docs/installing-snapd",
      note: "One-time — installs snapd if it isn't already. The exact command depends on your distro (Snapcraft's own guide covers all of them, not just apt-based ones).",
    },
  },
  appimage: { kind: "link", setup: APPIMAGE_SETUP },
  "appimage-manual": { kind: "link", setup: APPIMAGE_SETUP },
  "pacman-aur": {
    kind: "command",
    command: (pkg) => `yay -S ${pkg.name}`,
    setup: {
      kind: "command",
      command: "# install an AUR helper first, e.g.: https://github.com/Jguer/yay#installation",
      note: "One-time — the AUR itself needs a helper (yay, paru, ...), pacman alone can't reach it.",
    },
  },
  "pacman-arch": { kind: "command", command: (pkg) => `sudo pacman -S ${pkg.name}` },
  "deb-debian": {
    kind: "command",
    deepLink: { url: (pkg) => `apt:${pkg.name}` },
    command: (pkg) => `sudo apt install ${pkg.name}`,
  },
  "deb-ubuntu": {
    kind: "command",
    deepLink: { url: (pkg) => `apt:${pkg.name}` },
    command: (pkg) => `sudo apt install ${pkg.name}`,
  },
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
      kind: "command",
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
  "github-releases": { kind: "link" },
};

export function installCommand(pkg: SourcedPackage): string | undefined {
  return INSTALL_METHODS[pkg.source]?.command?.(pkg);
}

export function installDeepLink(pkg: SourcedPackage): string | undefined {
  return INSTALL_METHODS[pkg.source]?.deepLink?.url(pkg);
}

export function installWebsiteLink(
  pkg: SourcedPackage,
  appHomepage: string | undefined,
): string | undefined {
  const method = INSTALL_METHODS[pkg.source];
  return method?.websiteLink?.(pkg) ?? pkg.homepage ?? appHomepage;
}

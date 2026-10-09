import { component$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { SOURCE_LABELS, type PackageSourceId } from "~/catalog-types";
import { hasStorePage } from "~/data/store-pages";

// Mirrors tuxery/catalog's docs/sources.md — kept in sync by hand, no
// cross-repo import (separate repos). One line per source: how Tuxery
// actually retrieves its listing.
const METHODS: Record<PackageSourceId, string> = {
  "flatpak-flathub": "Flathub's own appstream repodata feed.",
  "flatpak-appcenter": "elementary's own Flatpak remote, same appstream format as Flathub.",
  "snap-snapcraft": "Snapcraft's public search API, swept by category and letter.",
  appimage: "appimage.github.io's community-curated feed, cross-checked against GitHub Releases.",
  "appimage-manual": "A small hand-curated list for apps with no GitHub repo and no other source.",
  "pacman-aur": "Arch User Repository's full metadata dump.",
  "pacman-arch": "Arch's official core/extra/multilib repos.",
  "deb-debian": "Debian stable's own Packages index.",
  "deb-ubuntu": "The current Ubuntu release's own Packages index.",
  "deb-mint": "Linux Mint's own package index, scoped to Mint's own software.",
  "deb-popos": "Pop!_OS's own package index, scoped to System76's own software.",
  "deb-deepin": "Deepin's own package index, scoped to Deepin's own software.",
  "deb-mxlinux": "MX Linux's own package index, scoped to the MX tools.",
  "rpm-fedora": "The current Fedora release's Everything + updates repodata.",
  "rpm-opensuse": "openSUSE Tumbleweed's oss/non-oss repodata.",
  "rpm-rpmfusion": "RPM Fusion's free + nonfree repodata, addon repos for Fedora.",
  "nix-nixpkgs": "The Nixpkgs package set (nixos-unstable).",
  "apk-alpine": "Alpine's APKINDEX (latest stable).",
  "xbps-void": "Void's own package index.",
  slackware: "Slackware's own package tree (-current).",
  "eopkg-solus": "Solus's own eopkg repository.",
  "ebuild-gentoo": "The Gentoo Portage tree.",
  gog: "GOG's own catalog API, scoped to Linux-compatible titles.",
  lutris: "Lutris's installer API, scoped to native Linux installers.",
  "github-releases": 'GitHub repositories tagged "linux-app" that publish a real tagged release.',
  "vendor-repos":
    "A hand-curated list of first-party vendor apt repos (Brave, Chrome, VS Code, ...), read from each vendor's own Packages index.",
};

// Grouped by package format rather than listed flat — same "provider vs.
// format" split the source-naming convention itself follows
// (`<format>-<provider>`, e.g. `deb-debian`). Was /distros/ ("Browse by
// source") before both pages merged into this one.
const GROUPS: { title: string; sources: PackageSourceId[] }[] = [
  { title: "Flatpak", sources: ["flatpak-flathub", "flatpak-appcenter"] },
  { title: "Snap", sources: ["snap-snapcraft"] },
  { title: "AppImage", sources: ["appimage", "appimage-manual"] },
  {
    title: "Debian family (.deb)",
    sources: ["deb-debian", "deb-ubuntu", "deb-mint", "deb-popos", "deb-deepin", "deb-mxlinux"],
  },
  { title: "RPM", sources: ["rpm-fedora", "rpm-opensuse", "rpm-rpmfusion"] },
  { title: "Arch (pacman)", sources: ["pacman-arch", "pacman-aur"] },
  {
    title: "Other native package managers",
    sources: [
      "nix-nixpkgs",
      "apk-alpine",
      "xbps-void",
      "slackware",
      "eopkg-solus",
      "ebuild-gentoo",
    ],
  },
  { title: "Game storefronts", sources: ["gog", "lutris"] },
  { title: "Straight from the publisher", sources: ["vendor-repos", "github-releases"] },
];

export default component$(() => {
  return (
    <div class="flex flex-col gap-8">
      <div>
        <h1 class="text-3xl font-bold mb-2">Sources</h1>
        <p class="text-base-content/70">
          Every source Tuxery pulls from today, grouped by package format, and how each one is read.
          Tuxery never runs installer code or hosts a package itself — every "Install" button hands
          off to the real source below. Browse a source to see everything Tuxery has from it; stores
          with a storefront of their own also get a page with their trending apps.
        </p>
      </div>

      {GROUPS.map((group) => (
        <section key={group.title}>
          <h2 class="text-lg font-semibold mb-3">{group.title}</h2>
          <div class="grid gap-3 sm:grid-cols-2">
            {group.sources.map((source) => (
              <div key={source} class="card bg-base-100 border border-base-300">
                <div class="card-body p-5 gap-1">
                  <h3 class="card-title text-base">{SOURCE_LABELS[source]}</h3>
                  <p class="text-sm text-base-content/70">{METHODS[source]}</p>
                  <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm">
                    <a
                      href={`/browse/?source=${encodeURIComponent(source)}`}
                      class="link link-primary"
                    >
                      Browse this source →
                    </a>
                    {hasStorePage(source) && (
                      <a href={`/sources/${source}/`} class="link link-primary">
                        Store page →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div class="border border-base-300 rounded-box p-6 text-sm text-base-content/70 flex flex-col gap-2">
        <p>
          Some sources only add details to apps listed elsewhere: the AppStream metadata Debian,
          Ubuntu, Fedora, openSUSE and Arch publish (icons, screenshots, categories), GNOME's ODRS
          reviews and Flathub's statistics. See{" "}
          <a href="/docs/merging/" class="link link-primary">
            how sources are merged
          </a>
          , and the{" "}
          <a href="/docs/coverage/" class="link link-primary">
            per-source to-do
          </a>{" "}
          for what each source still misses.
        </p>
        <p>
          Want a source's listing removed, spot something wrong with its coverage, or think Tuxery
          should cover a source it doesn't yet? See{" "}
          <a href="/docs/contribute/" class="link link-primary">
            How to contribute
          </a>{" "}
          — the same reporting flow covers all three.
        </p>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Sources — Tuxery",
  meta: [
    {
      name: "description",
      content:
        "Every source Tuxery's catalog pulls from, grouped by package format, and how each one is read.",
    },
  ],
};

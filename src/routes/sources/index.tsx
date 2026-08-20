import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import type { PackageSourceId } from "~/catalog-types";

interface SourceCredit {
  id: PackageSourceId;
  name: string;
  method: string;
}

// Mirrors tuxery/catalog's docs/sources.md — kept in sync by hand, no
// cross-repo import (separate repos). One line per source: what it is and
// how Tuxery actually retrieves its listing.
const SOURCES: SourceCredit[] = [
  { id: "flatpak-flathub", name: "Flathub", method: "Flathub's own appstream repodata feed." },
  {
    id: "flatpak-appcenter",
    name: "elementary AppCenter",
    method: "elementary's own Flatpak remote, same appstream format as Flathub.",
  },
  {
    id: "snap-snapcraft",
    name: "Snap Store",
    method: "Snapcraft's public search API, swept by category and letter.",
  },
  {
    id: "appimage",
    name: "AppImage (community feed)",
    method: "appimage.github.io's community-curated feed, cross-checked against GitHub Releases.",
  },
  {
    id: "appimage-manual",
    name: "AppImage (direct download)",
    method: "A small hand-curated list for apps with no GitHub repo and no other source.",
  },
  { id: "pacman-aur", name: "AUR", method: "Arch User Repository's full metadata dump." },
  {
    id: "pacman-arch",
    name: "Arch Linux (official)",
    method: "Arch's official core/extra/multilib repos.",
  },
  { id: "deb-debian", name: "Debian", method: "Debian's own Packages index." },
  { id: "deb-ubuntu", name: "Ubuntu", method: "Ubuntu's own Packages index." },
  { id: "deb-mint", name: "Linux Mint", method: "Linux Mint's own package index." },
  { id: "deb-popos", name: "Pop!_OS", method: "Pop!_OS's own package index." },
  { id: "deb-deepin", name: "Deepin", method: "Deepin's own package index." },
  { id: "deb-mxlinux", name: "MX Linux", method: "MX Linux's own package index." },
  { id: "rpm-fedora", name: "Fedora", method: "Fedora's Everything + updates repodata." },
  { id: "rpm-opensuse", name: "openSUSE", method: "openSUSE's oss/non-oss repodata." },
  { id: "nix-nixpkgs", name: "Nixpkgs", method: "The Nixpkgs package set." },
  { id: "apk-alpine", name: "Alpine Linux", method: "Alpine's APKINDEX." },
  { id: "xbps-void", name: "Void Linux", method: "Void's own package index." },
  { id: "slackware", name: "Slackware", method: "Slackware's own package tree." },
  { id: "eopkg-solus", name: "Solus", method: "Solus's own eopkg repository." },
  { id: "ebuild-gentoo", name: "Gentoo", method: "The Gentoo Portage tree." },
  { id: "gog", name: "GOG", method: "GOG's own catalog API, scoped to Linux-compatible titles." },
  {
    id: "lutris",
    name: "Lutris",
    method: "Lutris's installer API, scoped to native Linux installers.",
  },
];

export default component$(() => {
  return (
    <div class="flex flex-col gap-8">
      <div>
        <h1 class="text-3xl font-bold mb-2">Sources</h1>
        <p class="text-base-content/70">
          Every source Tuxery pulls from today, and how. Tuxery never runs installer code or hosts a
          package itself — every "Install" button hands off to the real source below.
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        {SOURCES.map((source) => (
          <div key={source.id} class="card bg-base-100 border border-base-300">
            <div class="card-body p-5">
              <h2 class="card-title text-base">{source.name}</h2>
              <p class="text-sm text-base-content/70">{source.method}</p>
              <a
                href={`/browse/?source=${encodeURIComponent(source.id)}`}
                class="text-sm link link-primary mt-1"
              >
                Browse this source →
              </a>
            </div>
          </div>
        ))}
      </div>

      <div class="border border-base-300 rounded-box p-6 text-sm text-base-content/70 flex flex-col gap-2">
        <p>
          Want a source's listing removed, or spot something wrong with its coverage? See{" "}
          <a href="/contribute/" class="link link-primary">
            How to contribute
          </a>{" "}
          — the same reporting flow covers both.
        </p>
        <p>Think Tuxery should cover a source it doesn't yet? Same page, same flow.</p>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Sources — Tuxery",
  meta: [
    {
      name: "description",
      content: "Every source Tuxery's catalog pulls from, and how it retrieves each one's listing.",
    },
  ],
};

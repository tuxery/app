import { component$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { SOURCE_LABELS, type PackageSourceId } from "~/catalog-types";
import { METHODS } from "~/data/source-methods";
import { hasStorePage } from "~/data/store-pages";

// Grouped by package format rather than listed flat — same "provider vs.
// format" split the source-naming convention itself follows
// (`<format>-<provider>`, e.g. `deb-debian`). Was /distros/ ("Browse by
// source") before both pages merged into this one.
const GROUPS: { title: string; sources: PackageSourceId[] }[] = [
  { title: "Flatpak", sources: ["flatpak-flathub", "flatpak-appcenter"] },
  { title: "Snap", sources: ["snap-snapcraft"] },
  { title: "AppImage", sources: ["appimage", "appimage-manual", "appimagehub"] },
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

// Sources that list no app of their own and only add details to apps
// listed above, so their cards link out instead of to /browse.
const DETAIL_SOURCES: { title: string; text: string; href: string; linkLabel: string }[] = [
  {
    title: "ODRS",
    text: "GNOME's Open Desktop Ratings Service: the star ratings shown for Flathub and elementary AppCenter apps. One public file of per-app vote counts; no review text or reviewer data is kept.",
    href: "https://odrs.gnome.org/",
    linkLabel: "odrs.gnome.org",
  },
  {
    title: "AppStream catalogs",
    text: "The AppStream metadata Debian, Ubuntu, Fedora, openSUSE and Arch publish for their packages: icons, screenshots, categories and longer descriptions. Icons and screenshots load from their servers.",
    href: "https://www.freedesktop.org/software/appstream/docs/",
    linkLabel: "About AppStream",
  },
  {
    title: "Popularity statistics",
    text: "Debian's popcon and Arch's pkgstats, opt-in surveys of what machines have installed, and the AUR's own usage ranking: used to order the trending lists.",
    href: "/docs/rankings/",
    linkLabel: "How rankings work",
  },
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
                    <a href={`/docs/sources/${source}/`} class="link link-primary">
                      Details and terms →
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

      <section>
        <h2 class="text-lg font-semibold mb-1">Details only</h2>
        <p class="text-sm text-base-content/70 mb-3">
          These list no apps of their own: they add details to apps listed above. See{" "}
          <a href="/docs/merging/" class="link link-primary">
            how sources are merged
          </a>
          .
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          {DETAIL_SOURCES.map((detail) => (
            <div key={detail.title} class="card bg-base-100 border border-base-300">
              <div class="card-body p-5 gap-1">
                <h3 class="card-title text-base">{detail.title}</h3>
                <p class="text-sm text-base-content/70">{detail.text}</p>
                <div class="mt-1 text-sm">
                  <a href={detail.href} class="link link-primary">
                    {detail.linkLabel} →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div class="border border-base-300 rounded-box p-6 text-sm text-base-content/70 flex flex-col gap-2">
        <p>
          What Tuxery can't get from each source, and why, is on{" "}
          <a href="/docs/source-gaps/" class="link link-primary">
            What each source is missing
          </a>
          .
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

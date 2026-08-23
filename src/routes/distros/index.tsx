import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { SOURCE_LABELS, type PackageSourceId } from "~/catalog-types";

// Grouped by package format rather than listed flat — same "provider vs.
// format" split the source-naming convention itself follows
// (`<format>-<provider>`, e.g. `deb-debian`).
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
];

export default component$(() => {
  return (
    <div class="flex flex-col gap-8">
      <div>
        <h1 class="text-3xl font-bold mb-2">Browse by source</h1>
        <p class="text-base-content/70">
          Everything Tuxery has from one specific provider or package format.
        </p>
      </div>

      {GROUPS.map((group) => (
        <section key={group.title}>
          <h2 class="text-lg font-semibold mb-3">{group.title}</h2>
          <div class="flex flex-wrap gap-2">
            {group.sources.map((source) => (
              <a
                key={source}
                href={`/browse/?source=${encodeURIComponent(source)}`}
                class="btn btn-outline btn-sm"
              >
                {SOURCE_LABELS[source]}
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Browse by source — Tuxery",
  meta: [
    {
      name: "description",
      content: "Browse the Tuxery catalog by a specific source, distro, or package format.",
    },
  ],
};

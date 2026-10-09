import type { PackageSourceId } from "~/catalog-types";

export interface StorePageInfo {
  id: PackageSourceId;
  name: string;
  tagline: string;
  method: string;
  externalUrl: string;
}

// Only the sources with a real, browsable storefront of their own get a
// dedicated page (`/sources/<id>/`) — not every `/docs/sources/` credit (a distro's raw
// package index isn't a "store" anyone visits directly the way Flathub,
// the Snap Store, GOG, or Lutris are). Two universal app stores + two
// gaming storefronts, replacing the homepage's old "All games"/"Lutris
// only"/"All apps" tiles (those still exist — see /apps/, /games/,
// /browse/ — this is a different, source-scoped surface).
export const STORE_PAGES: StorePageInfo[] = [
  {
    id: "flatpak-flathub",
    name: "Flathub",
    tagline: "The Flatpak store — sandboxed apps that run the same on every distro.",
    method: "Flathub's own appstream repodata feed.",
    externalUrl: "https://flathub.org",
  },
  {
    id: "snap-snapcraft",
    name: "Snap Store",
    tagline: "Canonical's universal package store, pre-installed on Ubuntu.",
    method: "Snapcraft's public search API, swept by category and letter.",
    externalUrl: "https://snapcraft.io/store",
  },
  {
    id: "gog",
    name: "GOG",
    tagline: "DRM-free games, curated and sold directly by GOG.com.",
    method: "GOG's own catalog API, scoped to Linux-compatible titles.",
    externalUrl: "https://www.gog.com",
  },
  {
    id: "lutris",
    name: "Lutris",
    tagline: "Open-source gaming platform with ready-made installers for native Linux games.",
    method: "Lutris's installer API, scoped to native Linux installers.",
    externalUrl: "https://lutris.net",
  },
];

export function hasStorePage(source: PackageSourceId): boolean {
  return STORE_PAGES.some((store) => store.id === source);
}

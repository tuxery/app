import type { PackageSourceId } from "~/catalog-types";

export interface StorePageInfo {
  id: PackageSourceId;
  name: string;
  tagline: string;
  /** A few words for the homepage's Stores list. */
  summary: string;
  method: string;
  externalUrl: string;
  /** What "Recently updated" is sorted by for this store, when it gives a date at all (AppImageHub, GOG and Lutris don't, so their pages have no such row). */
  recentNote?: string;
}

// Only the sources with a real, browsable storefront of their own get a
// dedicated page (`/sources/<id>/`) — not every `/docs/sources/` credit (a distro's raw
// package index isn't a "store" anyone visits directly the way Flathub,
// the Snap Store, AppImageHub, GOG, or Lutris are). Three universal app
// stores, one per format (Flatpak, Snap, AppImage), and two gaming
// storefronts, replacing the homepage's old "All games"/"Lutris
// only"/"All apps" tiles (those still exist — see /apps/, /games/,
// /browse/ — this is a different, source-scoped surface).
export const STORE_PAGES: StorePageInfo[] = [
  {
    id: "flatpak-flathub",
    summary: "Flatpak apps, sandboxed",
    name: "Flathub",
    tagline: "The Flatpak store — sandboxed apps that run the same on every distro.",
    method: "Flathub's own appstream repodata feed.",
    externalUrl: "https://flathub.org",
    recentNote: "Newest release first, by the release date in each app's AppStream metadata.",
  },
  {
    id: "snap-snapcraft",
    summary: "Canonical's app store",
    name: "Snap Store",
    tagline: "Canonical's universal package store, pre-installed on Ubuntu.",
    method: "Snapcraft's search API, read page by page.",
    externalUrl: "https://snapcraft.io/store",
    recentNote: "Newest upload first, by the date each channel's revision reached the Snap Store.",
  },
  {
    id: "appimagehub",
    summary: "Portable AppImages",
    name: "AppImageHub",
    tagline: "The AppImage catalog — one file per app, nothing to install, runs on any distro.",
    method: "AppImageHub's OCS API, read once a week with opendesktop.org's permission.",
    externalUrl: "https://www.appimagehub.com",
  },
  {
    id: "gog",
    summary: "DRM-free games",
    name: "GOG",
    tagline: "DRM-free games, curated and sold directly by GOG.com.",
    method: "GOG's own catalog API, scoped to Linux-compatible titles.",
    externalUrl: "https://www.gog.com",
  },
  {
    id: "lutris",
    summary: "Game installers",
    name: "Lutris",
    tagline: "Open-source gaming platform with ready-made installers for native Linux games.",
    method: "Lutris's installer API, scoped to native Linux installers.",
    externalUrl: "https://lutris.net",
  },
];

export function hasStorePage(source: PackageSourceId): boolean {
  return STORE_PAGES.some((store) => store.id === source);
}

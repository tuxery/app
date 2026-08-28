import { CROSS_DISTRO_GROUP_IDS } from "~/settings";

/**
 * One tile in the Settings page's OS Selector tab. `distroGroupId` is this
 * distro's own native package group (matches an `~/settings`
 * `InstallFormatGroup.id`, which itself matches a `~/catalog-types`
 * `SOURCE_GROUP_MEMBERS` key) — `recommendedGroupIds` below always adds
 * the six `CROSS_DISTRO_GROUP_IDS` on top, so entries only need to name
 * their own native group, not repeat the same six every time.
 * `preActivatedRepoIds` names which `SpecialRepoOption.id`s this distro
 * family ships already enabled, out of the box — everything else recommended
 * still needs its setup step.
 *
 * Deliberately one tile per distro *family*, not per release version —
 * "as exhaustive as possible, but as few options as possible: consolidate
 * versions where you can" was the ask. A version/derivative only earns its
 * own tile when it genuinely changes what's recommended here (openSUSE
 * Tumbleweed vs. Leap are different release models entirely; elementary
 * OS ships its own AppCenter remote out of the box, Ubuntu doesn't); a
 * newer LTS — or an Arch derivative that's just Arch's own repos + AUR
 * with different branding (EndeavourOS, CachyOS, Garuda, ...) — that
 * keeps doing what its base already does doesn't. Same reasoning applies
 * the other way: Ubuntu's own official flavors (Kubuntu, Xubuntu,
 * Lubuntu, ...) differ only by desktop environment, never by package
 * source defaults, so they were never candidates for their own tile in
 * the first place. These are best-effort, general-knowledge facts about
 * each distro's defaults, not independently re-verified against each
 * one's current release notes — flag anything wrong and it's a one-line
 * fix.
 */
export interface OsCatalogEntry {
  id: string;
  label: string;
  distroGroupId: string;
  preActivatedRepoIds: string[];
}

export const OS_CATALOG: OsCatalogEntry[] = [
  { id: "ubuntu", label: "Ubuntu", distroGroupId: "Ubuntu", preActivatedRepoIds: ["snap-store"] },
  { id: "debian", label: "Debian", distroGroupId: "Debian", preActivatedRepoIds: [] },
  {
    id: "linux-mint",
    label: "Linux Mint",
    distroGroupId: "Linux Mint",
    // Ships Flatpak with Flathub pre-added; famously discourages Snap by
    // default rather than just leaving it uninstalled (a real distinction
    // from every other entry here) — not modeled separately yet, Snap
    // still just shows as "recommended, needs setup" like anywhere else.
    preActivatedRepoIds: ["flathub"],
  },
  {
    id: "pop-os",
    label: "Pop!_OS",
    distroGroupId: "Pop!_OS",
    preActivatedRepoIds: ["flathub"],
  },
  {
    id: "elementary",
    label: "elementary OS",
    // No dedicated catalog source group — elementary is Ubuntu-based, .deb
    // compatible, so its native packages come from the same "Ubuntu"
    // group everything else Ubuntu-based uses.
    distroGroupId: "Ubuntu",
    // The one real, already-modeled distinction: elementary AppCenter is
    // its own bundled app store, not an optional extra — the specialRepo
    // already exists (settings.ts's "elementary-appcenter") but no tile
    // used to reference it.
    preActivatedRepoIds: ["elementary-appcenter"],
  },
  {
    id: "zorin",
    label: "Zorin OS",
    distroGroupId: "Ubuntu",
    preActivatedRepoIds: [],
  },
  { id: "deepin", label: "Deepin", distroGroupId: "Deepin", preActivatedRepoIds: [] },
  { id: "mx-linux", label: "MX Linux", distroGroupId: "MX Linux", preActivatedRepoIds: [] },
  { id: "fedora", label: "Fedora", distroGroupId: "Fedora", preActivatedRepoIds: [] },
  { id: "arch", label: "Arch Linux", distroGroupId: "Arch Linux", preActivatedRepoIds: [] },
  {
    id: "manjaro",
    label: "Manjaro",
    // Same reasoning as elementary: no dedicated source, Arch-compatible
    // (pacman + its own repos), so it shares Arch Linux's native group.
    // Deliberately NOT folded into the plain "Arch Linux" tile itself,
    // unlike EndeavourOS/CachyOS/Garuda — Manjaro's AUR usage carries a
    // real, distro-specific risk the others don't: its own repos trail
    // Arch's by design (delayed-update model), so AUR packages built
    // against current Arch libraries can mismatch Manjaro's older ones.
    // Nothing in today's data model expresses "recommended, but riskier
    // here" — still just shows AUR the same as any other Arch-family
    // tile, this comment is the only place that nuance lives for now.
    distroGroupId: "Arch Linux",
    preActivatedRepoIds: [],
  },
  {
    id: "opensuse-tumbleweed",
    label: "openSUSE Tumbleweed",
    distroGroupId: "openSUSE",
    preActivatedRepoIds: [],
  },
  {
    id: "opensuse-leap",
    label: "openSUSE Leap",
    distroGroupId: "openSUSE",
    preActivatedRepoIds: [],
  },
  { id: "alpine", label: "Alpine Linux", distroGroupId: "Alpine Linux", preActivatedRepoIds: [] },
  { id: "void", label: "Void Linux", distroGroupId: "Void Linux", preActivatedRepoIds: [] },
  { id: "slackware", label: "Slackware", distroGroupId: "Slackware", preActivatedRepoIds: [] },
  { id: "solus", label: "Solus", distroGroupId: "Solus", preActivatedRepoIds: [] },
  { id: "gentoo", label: "Gentoo", distroGroupId: "Gentoo", preActivatedRepoIds: [] },
  { id: "nixos", label: "NixOS", distroGroupId: "Nixpkgs", preActivatedRepoIds: [] },
];

export function findOsEntry(id: string | undefined): OsCatalogEntry | undefined {
  return id ? OS_CATALOG.find((entry) => entry.id === id) : undefined;
}

/** This entry's own native group plus every cross-distro format/storefront — see this file's header comment and `~/settings`'s `CROSS_DISTRO_GROUP_IDS`. */
export function recommendedGroupIds(entry: OsCatalogEntry): Set<string> {
  return new Set([entry.distroGroupId, ...CROSS_DISTRO_GROUP_IDS]);
}

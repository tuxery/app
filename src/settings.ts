import {
  createContextId,
  useContext,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  type Signal,
} from "@builder.io/qwik";

export type Theme = "light" | "dark" | "system";

/**
 * A one-time setup step some of a category's packages need before they'll
 * actually install — adding a Flatpak remote, installing an AUR helper,
 * enabling a distro's non-default repo component (Ubuntu's Universe,
 * openSUSE's non-oss, ...). Checking it here and confirming "I've already
 * done this" in an app's install drawer (for the handful precise enough to
 * show it there — see `~/install-methods`) are the same flag; unchecked by
 * default since nobody's done the setup yet.
 */
export interface SpecialRepoOption {
  id: string;
  label: string;
  activated: boolean;
  setup:
    | { kind: "command"; command: string; note: string }
    | { kind: "link"; url: string; note: string };
}

/** One packaging format or distro shown on an app's page — `id` matches a `~/catalog-types` `SOURCE_GROUP_MEMBERS` key 1:1, so Show/Hide can look it up directly without a separate mapping. */
export interface InstallFormatGroup {
  id: string;
  label: string;
  shown: boolean;
  specialRepos: SpecialRepoOption[];
}

export interface SettingsState {
  theme: Signal<Theme>;
  installGroups: Signal<InstallFormatGroup[]>;
}

interface PersistedSettings {
  theme: Theme;
  installGroups: InstallFormatGroup[];
}

const STORAGE_KEY = "tuxery:settings";

// Kept in sync by hand with catalog's docs/sources.md and, 1:1 by id, with
// catalog-types.ts's SOURCE_GROUP_MEMBERS — no cross-repo import (separate
// repos), same convention as catalog.ts itself. Only sources with a real
// one-time setup step get a `specialRepos` entry (see
// app/[id]/index.tsx's SOURCE_ID_TO_PACKAGE_SOURCE for which ones are also
// precise enough to surface in a specific app's install drawer, vs. ones
// like Universe/non-oss that only apply to *some* packages from a shared
// source and so only ever show here, generically, not per-app).
const defaultInstallGroups = (): InstallFormatGroup[] => [
  {
    id: "Flatpak",
    label: "Flatpak",
    shown: true,
    specialRepos: [
      {
        id: "flathub",
        label: "Flathub",
        activated: false,
        setup: {
          kind: "command",
          command:
            "flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo",
          note: "One-time — adds the Flathub remote to Flatpak.",
        },
      },
      {
        id: "elementary-appcenter",
        label: "elementary AppCenter",
        activated: false,
        setup: {
          kind: "command",
          command:
            "flatpak remote-add --if-not-exists appcenter https://flatpak.elementary.io/repo.flatpakrepo",
          note: "One-time — adds elementary's own Flatpak remote.",
        },
      },
    ],
  },
  {
    id: "Snap",
    label: "Snap",
    shown: true,
    specialRepos: [
      {
        id: "snap-store",
        label: "Snap Store",
        activated: false,
        setup: {
          kind: "link",
          url: "https://snapcraft.io/docs/installing-snapd",
          note: "One-time — installs snapd if it isn't already. The exact command depends on your distro, so this links to Snapcraft's own install guide rather than assuming apt.",
        },
      },
    ],
  },
  { id: "AppImage", label: "AppImage", shown: true, specialRepos: [] },
  {
    id: "Arch Linux",
    label: "Arch Linux",
    shown: true,
    specialRepos: [
      {
        id: "arch-aur",
        label: "AUR",
        activated: false,
        setup: {
          kind: "command",
          command: "# install an AUR helper first, e.g.: https://github.com/Jguer/yay#installation",
          note: "One-time — the AUR itself needs a helper (yay, paru, ...), pacman alone can't reach it.",
        },
      },
    ],
  },
  { id: "Debian", label: "Debian", shown: true, specialRepos: [] },
  {
    id: "Ubuntu",
    label: "Ubuntu",
    shown: true,
    specialRepos: [
      {
        id: "ubuntu-universe",
        label: "Universe",
        activated: false,
        setup: {
          kind: "command",
          command: "sudo add-apt-repository universe && sudo apt update",
          note: "One-time — Universe (community-maintained) isn't enabled by default. Applies to some Ubuntu packages, not all — the catalog can't tell which yet.",
        },
      },
    ],
  },
  {
    id: "Fedora",
    label: "Fedora",
    shown: true,
    specialRepos: [
      {
        id: "rpmfusion",
        label: "RPM Fusion",
        activated: false,
        setup: {
          kind: "command",
          command:
            "sudo dnf install https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm",
          note: "One-time — RPM Fusion is an addon repo, not enabled by default on Fedora.",
        },
      },
    ],
  },
  {
    id: "openSUSE",
    label: "openSUSE",
    shown: true,
    specialRepos: [
      {
        id: "opensuse-non-oss",
        label: "non-oss",
        activated: false,
        setup: {
          kind: "command",
          command: "sudo zypper mr -e repo-non-oss repo-update-non-oss",
          note: "One-time — oss and update are enabled by default, non-oss and update-non-oss aren't. Applies to some openSUSE packages, not all — the catalog can't tell which yet. Repo alias can vary by version; run zypper lr if this doesn't match.",
        },
      },
    ],
  },
  { id: "Alpine Linux", label: "Alpine Linux", shown: true, specialRepos: [] },
  { id: "Void Linux", label: "Void Linux", shown: true, specialRepos: [] },
  { id: "Slackware", label: "Slackware", shown: true, specialRepos: [] },
  { id: "Solus", label: "Solus", shown: true, specialRepos: [] },
  { id: "Gentoo", label: "Gentoo", shown: true, specialRepos: [] },
  { id: "Nixpkgs", label: "Nixpkgs", shown: true, specialRepos: [] },
  { id: "Linux Mint", label: "Linux Mint", shown: true, specialRepos: [] },
  { id: "Pop!_OS", label: "Pop!_OS", shown: true, specialRepos: [] },
  { id: "Deepin", label: "Deepin", shown: true, specialRepos: [] },
  { id: "MX Linux", label: "MX Linux", shown: true, specialRepos: [] },
  { id: "GOG", label: "GOG", shown: true, specialRepos: [] },
  { id: "Lutris", label: "Lutris", shown: true, specialRepos: [] },
  { id: "GitHub Releases", label: "GitHub Releases", shown: true, specialRepos: [] },
];

/** True only for a value shaped like the current `InstallFormatGroup[]` — guards against a pre-redesign persisted payload (old `enabled`/`sources` shape), which gets discarded in favor of fresh defaults rather than merged field-by-field into a schema it doesn't match. */
function isCurrentShape(value: unknown): value is InstallFormatGroup[] {
  return (
    Array.isArray(value) &&
    value.every(
      (group) => group && typeof group.shown === "boolean" && Array.isArray(group.specialRepos),
    )
  );
}

/**
 * A user's persisted `installGroups` unconditionally overrode the fresh
 * default on load — real bug, found live: anyone who'd visited /settings
 * before `defaultInstallGroups` grew stayed stuck on their old, incomplete
 * persisted list forever, since the stored value always won outright with
 * no reconciliation. Preserves the user's own `shown`/`activated` state for
 * groups (and, within them, special repos) they already have, and appends
 * whatever's new in `defaults` that their stored copy predates.
 */
function mergeInstallGroups(
  stored: InstallFormatGroup[],
  defaults: InstallFormatGroup[],
): InstallFormatGroup[] {
  const defaultsById = new Map(defaults.map((group) => [group.id, group]));

  const merged = stored.map((group) => {
    const def = defaultsById.get(group.id);
    if (!def) return group;
    const storedRepoIds = new Set(group.specialRepos.map((repo) => repo.id));
    const missingRepos = def.specialRepos.filter((repo) => !storedRepoIds.has(repo.id));
    return missingRepos.length
      ? { ...group, specialRepos: [...group.specialRepos, ...missingRepos] }
      : group;
  });

  const mergedIds = new Set(merged.map((group) => group.id));
  const missingGroups = defaults.filter((group) => !mergedIds.has(group.id));
  return [...merged, ...missingGroups];
}

export const SettingsContext = createContextId<SettingsState>("tuxery.settings");

/** Call once, at the layout root. Provides + persists the settings store. */
export const useProvideSettings = (): SettingsState => {
  const theme = useSignal<Theme>("system");
  const installGroups = useSignal<InstallFormatGroup[]>(defaultInstallGroups());

  const state: SettingsState = { theme, installGroups };
  useContextProvider(SettingsContext, state);

  const hydrated = useSignal(false);

  // Load persisted state on mount, then persist on every subsequent change.
  useVisibleTask$(({ track }) => {
    track(() => theme.value);
    track(() => JSON.stringify(installGroups.value));

    if (!hydrated.value) {
      hydrated.value = true;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as Partial<PersistedSettings>;
          if (stored.theme) theme.value = stored.theme;
          if (isCurrentShape(stored.installGroups)) {
            installGroups.value = mergeInstallGroups(stored.installGroups, defaultInstallGroups());
          }
        }
      } catch {
        // malformed/unavailable storage — keep defaults
      }
      return;
    }

    const payload: PersistedSettings = {
      theme: theme.value,
      installGroups: installGroups.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  });

  // Keep <html data-theme> in sync with the chosen theme (and OS changes in "system" mode).
  useVisibleTask$(({ track, cleanup }) => {
    const current = track(() => theme.value);
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const isDark = current === "system" ? media.matches : current === "dark";
      // The daisyUI theme names configured in global.css are "nord"/"dim",
      // not the generic "light"/"dark" — data-theme has to match one of
      // those or the browser silently keeps the --default theme.
      document.documentElement.setAttribute("data-theme", isDark ? "dim" : "nord");
    };

    apply();

    if (current === "system") {
      media.addEventListener("change", apply);
      cleanup(() => media.removeEventListener("change", apply));
    }
  });

  return state;
};

export const useSettings = () => useContext(SettingsContext);

export const toggleGroupShown = (installGroups: Signal<InstallFormatGroup[]>, index: number) => {
  installGroups.value = installGroups.value.map((group, i) =>
    i === index ? { ...group, shown: !group.shown } : group,
  );
};

/**
 * Marks one special-repo leaf as activated — looked up by its own `id`
 * rather than group/index, since callers like the install drawer work from
 * a `PackageSourceId`, not a position in the settings list. The same
 * mutator backs both the Settings page's checkbox and the drawer's "I've
 * already done this" button; a no-op if the id isn't found.
 */
export const setSourceActivated = (
  installGroups: Signal<InstallFormatGroup[]>,
  sourceId: string,
  activated: boolean,
) => {
  installGroups.value = installGroups.value.map((group) => ({
    ...group,
    specialRepos: group.specialRepos.map((repo) =>
      repo.id === sourceId ? { ...repo, activated } : repo,
    ),
  }));
};

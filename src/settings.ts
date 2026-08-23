import {
  createContextId,
  useContext,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  type Signal,
} from "@builder.io/qwik";

export type Theme = "light" | "dark" | "system";
export type CtaBehavior = "exhaustive" | "automatic";

/** One toggleable leaf under a format/distro group — not always a `PackageSourceId` 1:1 (e.g. Ubuntu's "Universe" is a repo component within the single "ubuntu" source, not a separate one). */
export interface InstallSourceOption {
  id: string;
  label: string;
  enabled: boolean;
}

/** A "big line" the settings page groups sources under — a packaging format (Flatpak, Snap, AppImage) or a distro (Ubuntu, Debian, ...), each with one or more concrete sources/components as children. */
export interface InstallFormatGroup {
  id: string;
  label: string;
  enabled: boolean;
  sources: InstallSourceOption[];
}

export interface SettingsState {
  theme: Signal<Theme>;
  ctaBehavior: Signal<CtaBehavior>;
  installGroups: Signal<InstallFormatGroup[]>;
}

interface PersistedSettings {
  theme: Theme;
  ctaBehavior: CtaBehavior;
  installGroups: InstallFormatGroup[];
}

const STORAGE_KEY = "tuxery:settings";

// Kept in sync by hand with catalog's docs/sources.md — no cross-repo
// import (separate repos), same convention as catalog.ts itself. One
// leaf per real PackageSourceId (see app/[id]/index.tsx's
// SOURCE_ID_TO_PACKAGE_SOURCE for the mapping) — a source missing here
// can never be picked in "automatic" install mode or excluded by the
// user, it just silently sorts last.
const defaultInstallGroups = (): InstallFormatGroup[] => [
  {
    id: "flatpak",
    label: "Flatpak",
    enabled: true,
    sources: [
      { id: "flathub", label: "Flathub", enabled: true },
      { id: "elementary-appcenter", label: "elementary AppCenter", enabled: true },
    ],
  },
  {
    id: "snap",
    label: "Snap",
    enabled: true,
    sources: [{ id: "snap-store", label: "Snap Store", enabled: true }],
  },
  {
    id: "appimage",
    label: "AppImage",
    enabled: true,
    sources: [
      { id: "appimagehub", label: "Community feed", enabled: true },
      { id: "appimage-manual", label: "Direct download", enabled: true },
    ],
  },
  {
    id: "arch",
    label: "Arch Linux",
    enabled: true,
    sources: [
      { id: "arch-aur", label: "AUR (community)", enabled: true },
      { id: "arch-official", label: "Official (core + extra)", enabled: true },
    ],
  },
  {
    id: "debian",
    label: "Debian",
    enabled: true,
    sources: [{ id: "debian-main", label: "Main", enabled: true }],
  },
  {
    id: "ubuntu",
    label: "Ubuntu",
    enabled: true,
    sources: [
      { id: "ubuntu-main", label: "Main", enabled: true },
      { id: "ubuntu-universe", label: "Universe", enabled: true },
    ],
  },
  {
    id: "mint",
    label: "Linux Mint",
    enabled: true,
    sources: [{ id: "mint-main", label: "Main", enabled: true }],
  },
  {
    id: "popos",
    label: "Pop!_OS",
    enabled: true,
    sources: [{ id: "popos-main", label: "Main", enabled: true }],
  },
  {
    id: "deepin",
    label: "Deepin",
    enabled: true,
    sources: [{ id: "deepin-main", label: "Main", enabled: true }],
  },
  {
    id: "mxlinux",
    label: "MX Linux",
    enabled: true,
    sources: [{ id: "mxlinux-main", label: "Main", enabled: true }],
  },
  {
    id: "fedora",
    label: "Fedora",
    enabled: true,
    sources: [{ id: "fedora-everything", label: "Everything", enabled: true }],
  },
  {
    id: "opensuse",
    label: "openSUSE",
    enabled: true,
    sources: [{ id: "opensuse-oss", label: "oss + non-oss", enabled: true }],
  },
  {
    id: "rpmfusion",
    label: "RPM Fusion",
    enabled: true,
    sources: [{ id: "rpmfusion-main", label: "free + nonfree", enabled: true }],
  },
  {
    id: "alpine",
    label: "Alpine Linux",
    enabled: true,
    sources: [{ id: "alpine-main", label: "main + community", enabled: true }],
  },
  {
    id: "void",
    label: "Void Linux",
    enabled: true,
    sources: [{ id: "void-main", label: "main + nonfree + multilib", enabled: true }],
  },
  {
    id: "slackware",
    label: "Slackware",
    enabled: true,
    sources: [{ id: "slackware-main", label: "Main", enabled: true }],
  },
  {
    id: "solus",
    label: "Solus",
    enabled: true,
    sources: [{ id: "solus-shannon", label: "Shannon", enabled: true }],
  },
  {
    id: "gentoo",
    label: "Gentoo",
    enabled: true,
    sources: [{ id: "gentoo-portage", label: "Portage", enabled: true }],
  },
  {
    id: "nixpkgs",
    label: "Nixpkgs",
    enabled: true,
    sources: [{ id: "nixpkgs-main", label: "Main", enabled: true }],
  },
  {
    id: "gog",
    label: "GOG",
    enabled: true,
    sources: [{ id: "gog-main", label: "Linux-compatible titles", enabled: true }],
  },
  {
    id: "lutris",
    label: "Lutris",
    enabled: true,
    sources: [{ id: "lutris-main", label: "Native Linux installers", enabled: true }],
  },
];

export const SettingsContext = createContextId<SettingsState>("tuxery.settings");

/** Call once, at the layout root. Provides + persists the settings store. */
export const useProvideSettings = (): SettingsState => {
  const theme = useSignal<Theme>("system");
  const ctaBehavior = useSignal<CtaBehavior>("exhaustive");
  const installGroups = useSignal<InstallFormatGroup[]>(defaultInstallGroups());

  const state: SettingsState = { theme, ctaBehavior, installGroups };
  useContextProvider(SettingsContext, state);

  const hydrated = useSignal(false);

  // Load persisted state on mount, then persist on every subsequent change.
  useVisibleTask$(({ track }) => {
    track(() => theme.value);
    track(() => ctaBehavior.value);
    track(() => JSON.stringify(installGroups.value));

    if (!hydrated.value) {
      hydrated.value = true;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as Partial<PersistedSettings>;
          if (stored.theme) theme.value = stored.theme;
          if (stored.ctaBehavior) ctaBehavior.value = stored.ctaBehavior;
          if (stored.installGroups) installGroups.value = stored.installGroups;
        }
      } catch {
        // malformed/unavailable storage — keep defaults
      }
      return;
    }

    const payload: PersistedSettings = {
      theme: theme.value,
      ctaBehavior: ctaBehavior.value,
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

/** Move the group at `index` up (-1) or down (+1) in preference order. */
export const reorderInstallGroup = (
  installGroups: Signal<InstallFormatGroup[]>,
  index: number,
  direction: -1 | 1,
) => {
  const target = index + direction;
  const list = installGroups.value;
  if (target < 0 || target >= list.length) return;
  const next = [...list];
  const item = next[index];
  if (!item) return;
  next.splice(index, 1);
  next.splice(target, 0, item);
  installGroups.value = next;
};

export const toggleInstallGroup = (installGroups: Signal<InstallFormatGroup[]>, index: number) => {
  installGroups.value = installGroups.value.map((group, i) =>
    i === index ? { ...group, enabled: !group.enabled } : group,
  );
};

export const toggleInstallSource = (
  installGroups: Signal<InstallFormatGroup[]>,
  groupIndex: number,
  sourceIndex: number,
) => {
  installGroups.value = installGroups.value.map((group, i) =>
    i === groupIndex
      ? {
          ...group,
          sources: group.sources.map((source, j) =>
            j === sourceIndex ? { ...source, enabled: !source.enabled } : source,
          ),
        }
      : group,
  );
};

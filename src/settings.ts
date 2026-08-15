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
// import (separate repos), same convention as catalog.ts itself. Not
// wired into search filtering yet (tracked on the Tuxery GitHub
// Project); this is the preference the UI will read once it is.
const defaultInstallGroups = (): InstallFormatGroup[] => [
  {
    id: "flatpak",
    label: "Flatpak",
    enabled: true,
    sources: [{ id: "flathub", label: "Flathub", enabled: true }],
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
    sources: [{ id: "appimagehub", label: "AppImageHub", enabled: true }],
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
    id: "fedora",
    label: "Fedora",
    enabled: true,
    sources: [{ id: "fedora-everything", label: "Everything", enabled: true }],
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
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
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

import {
  createContextId,
  useContext,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  type Signal,
} from "@builder.io/qwik";

import { SOURCE_LABELS, type PackageSourceId } from "~/catalog";

export type Theme = "light" | "dark" | "system";
export type CtaBehavior = "automatic" | "exhaustive";
/** The sources with a live connector today — see catalog.ts's `PackageSourceId` for the full set. */
export type InstallMethodId = Extract<PackageSourceId, "flathub" | "snapcraft" | "appimage" | "aur">;

export interface InstallMethodPreference {
  id: InstallMethodId;
  enabled: boolean;
}

export interface SettingsState {
  theme: Signal<Theme>;
  ctaBehavior: Signal<CtaBehavior>;
  installMethods: Signal<InstallMethodPreference[]>;
}

interface PersistedSettings {
  theme: Theme;
  ctaBehavior: CtaBehavior;
  installMethods: InstallMethodPreference[];
}

const STORAGE_KEY = "tuxery:settings";

const LIVE_INSTALL_METHODS: InstallMethodId[] = ["flathub", "snapcraft", "appimage", "aur"];

export const INSTALL_METHOD_LABELS: Record<InstallMethodId, string> = Object.fromEntries(
  LIVE_INSTALL_METHODS.map((id) => [id, SOURCE_LABELS[id]]),
) as Record<InstallMethodId, string>;

const defaultInstallMethods = (): InstallMethodPreference[] =>
  LIVE_INSTALL_METHODS.map((id) => ({ id, enabled: true }));

export const SettingsContext = createContextId<SettingsState>("tuxery.settings");

/** Call once, at the layout root. Provides + persists the settings store. */
export const useProvideSettings = (): SettingsState => {
  const theme = useSignal<Theme>("system");
  const ctaBehavior = useSignal<CtaBehavior>("automatic");
  const installMethods = useSignal<InstallMethodPreference[]>(defaultInstallMethods());

  const state: SettingsState = { theme, ctaBehavior, installMethods };
  useContextProvider(SettingsContext, state);

  const hydrated = useSignal(false);

  // Load persisted state on mount, then persist on every subsequent change.
  useVisibleTask$(({ track }) => {
    track(() => theme.value);
    track(() => ctaBehavior.value);
    track(() => JSON.stringify(installMethods.value));

    if (!hydrated.value) {
      hydrated.value = true;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as Partial<PersistedSettings>;
          if (stored.theme) theme.value = stored.theme;
          if (stored.ctaBehavior) ctaBehavior.value = stored.ctaBehavior;
          if (stored.installMethods) installMethods.value = stored.installMethods;
        }
      } catch {
        // malformed/unavailable storage — keep defaults
      }
      return;
    }

    const payload: PersistedSettings = {
      theme: theme.value,
      ctaBehavior: ctaBehavior.value,
      installMethods: installMethods.value,
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

/** Move the install method at `index` up (-1) or down (+1) in preference order. */
export const reorderInstallMethod = (
  installMethods: Signal<InstallMethodPreference[]>,
  index: number,
  direction: -1 | 1,
) => {
  const target = index + direction;
  const list = installMethods.value;
  if (target < 0 || target >= list.length) return;
  const next = [...list];
  const item = next[index];
  if (!item) return;
  next.splice(index, 1);
  next.splice(target, 0, item);
  installMethods.value = next;
};

export const toggleInstallMethod = (installMethods: Signal<InstallMethodPreference[]>, index: number) => {
  installMethods.value = installMethods.value.map((method, i) =>
    i === index ? { ...method, enabled: !method.enabled } : method,
  );
};

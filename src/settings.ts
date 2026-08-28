import {
  createContextId,
  useContext,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  type Signal,
} from "@builder.io/qwik";
import { toMapByKey } from "@helpers4/map";
import { safeJsonParse } from "@helpers4/object";

export type Theme = "light" | "dark" | "system";

/**
 * "off"/"on" are an explicit user override, always winning regardless of
 * the selected OS. "auto" defers to whatever the selected OS (see
 * `~/os-catalog`) recommends — or, with no OS selected, to the same
 * always-shown/never-preactivated behavior this had before OS selection
 * existed, so a user who's never touched the OS Selector tab sees no
 * change at all. Picking an OS doesn't overwrite anyone's explicit
 * choices, only what's still "auto".
 */
export type TriState = "off" | "auto" | "on";

/**
 * A one-time setup step some of a category's packages need before they'll
 * actually install — adding a Flatpak remote, installing an AUR helper,
 * enabling a distro's non-default repo component (Ubuntu's Universe,
 * openSUSE's non-oss, ...). Checking it here and confirming "I've already
 * done this" in an app's install drawer (for the handful precise enough to
 * show it there — see `~/install-methods`) are the same flag; "auto" by
 * default since nobody's done the setup yet and no OS is selected.
 */
export interface SpecialRepoOption {
  id: string;
  label: string;
  activated: TriState;
  setup:
    | { kind: "command"; command: string; note: string }
    | { kind: "link"; url: string; note: string };
}

/** One packaging format or distro shown on an app's page — `id` matches a `~/catalog-types` `SOURCE_GROUP_MEMBERS` key 1:1, so Show/Hide can look it up directly without a separate mapping. */
export interface InstallFormatGroup {
  id: string;
  label: string;
  shown: TriState;
  specialRepos: SpecialRepoOption[];
}

/**
 * Cross-distro packaging formats and distribution-agnostic storefronts —
 * install once, work the same regardless of which distro tile is
 * selected in the OS Selector tab, so every `~/os-catalog` entry
 * recommends all six of these alongside its own native distro group. Also
 * the "Cross-distro formats" vs. "Distro packages" split on the Sources
 * tab — a UI/recommendation grouping, not a `~/catalog-types` concept.
 */
export const CROSS_DISTRO_GROUP_IDS = new Set([
  "Flatpak",
  "Snap",
  "AppImage",
  "GOG",
  "Lutris",
  "GitHub Releases",
]);

export interface SettingsState {
  theme: Signal<Theme>;
  installGroups: Signal<InstallFormatGroup[]>;
  /** Selected `~/os-catalog` entry id — `undefined` until the user picks one (or, once real detection exists, until it succeeds; see the "Best-effort OS/platform detection" board card, deliberately out of scope here). */
  osId: Signal<string | undefined>;
}

interface PersistedSettings {
  theme: Theme;
  installGroups: InstallFormatGroup[];
  osId: string | undefined;
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
    shown: "auto",
    specialRepos: [
      {
        id: "flathub",
        label: "Flathub",
        activated: "auto",
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
        activated: "auto",
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
    shown: "auto",
    specialRepos: [
      {
        id: "snap-store",
        label: "Snap Store",
        activated: "auto",
        setup: {
          kind: "link",
          url: "https://snapcraft.io/docs/installing-snapd",
          note: "One-time — installs snapd if it isn't already. The exact command depends on your distro, so this links to Snapcraft's own install guide rather than assuming apt.",
        },
      },
    ],
  },
  {
    id: "AppImage",
    label: "AppImage",
    shown: "auto",
    specialRepos: [
      {
        id: "appimage-integration",
        label: "Desktop integration",
        activated: "auto",
        setup: {
          kind: "link",
          url: "https://flathub.org/apps/it.mijorus.gearlever",
          note: "Most distros need a small helper to add AppImages to your app menu and keep them updated — Gear Lever (via Flatpak, so it works the same on any distro) is the actively maintained pick. Some setups already handle this on their own; skip it if yours does.",
        },
      },
    ],
  },
  {
    id: "Arch Linux",
    label: "Arch Linux",
    shown: "auto",
    specialRepos: [
      {
        id: "arch-aur",
        label: "AUR",
        activated: "auto",
        setup: {
          kind: "command",
          command: "# install an AUR helper first, e.g.: https://github.com/Jguer/yay#installation",
          note: "One-time — the AUR itself needs a helper (yay, paru, ...), pacman alone can't reach it.",
        },
      },
    ],
  },
  { id: "Debian", label: "Debian", shown: "auto", specialRepos: [] },
  {
    id: "Ubuntu",
    label: "Ubuntu",
    shown: "auto",
    specialRepos: [
      {
        id: "ubuntu-universe",
        label: "Universe",
        activated: "auto",
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
    shown: "auto",
    specialRepos: [
      {
        id: "rpmfusion",
        label: "RPM Fusion",
        activated: "auto",
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
    shown: "auto",
    specialRepos: [
      {
        id: "opensuse-non-oss",
        label: "non-oss",
        activated: "auto",
        setup: {
          kind: "command",
          command: "sudo zypper mr -e repo-non-oss repo-update-non-oss",
          note: "One-time — oss and update are enabled by default, non-oss and update-non-oss aren't. Applies to some openSUSE packages, not all — the catalog can't tell which yet. Repo alias can vary by version; run zypper lr if this doesn't match.",
        },
      },
    ],
  },
  { id: "Alpine Linux", label: "Alpine Linux", shown: "auto", specialRepos: [] },
  { id: "Void Linux", label: "Void Linux", shown: "auto", specialRepos: [] },
  { id: "Slackware", label: "Slackware", shown: "auto", specialRepos: [] },
  { id: "Solus", label: "Solus", shown: "auto", specialRepos: [] },
  { id: "Gentoo", label: "Gentoo", shown: "auto", specialRepos: [] },
  { id: "Nixpkgs", label: "Nixpkgs", shown: "auto", specialRepos: [] },
  { id: "Linux Mint", label: "Linux Mint", shown: "auto", specialRepos: [] },
  { id: "Pop!_OS", label: "Pop!_OS", shown: "auto", specialRepos: [] },
  { id: "Deepin", label: "Deepin", shown: "auto", specialRepos: [] },
  { id: "MX Linux", label: "MX Linux", shown: "auto", specialRepos: [] },
  { id: "GOG", label: "GOG", shown: "auto", specialRepos: [] },
  { id: "Lutris", label: "Lutris", shown: "auto", specialRepos: [] },
  { id: "GitHub Releases", label: "GitHub Releases", shown: "auto", specialRepos: [] },
];

const TRI_STATES = new Set(["off", "auto", "on"]);

/** True only for a value shaped like the current `InstallFormatGroup[]` — guards against a pre-redesign persisted payload (the old plain-boolean `shown`/`activated` shape, or older still, `enabled`/`sources`), which gets discarded in favor of fresh defaults rather than merged field-by-field into a schema it doesn't match. */
function isCurrentShape(value: unknown): value is InstallFormatGroup[] {
  return (
    Array.isArray(value) &&
    value.every(
      (group) => group && TRI_STATES.has(group.shown) && Array.isArray(group.specialRepos),
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
  const defaultsById = toMapByKey(defaults, (group) => group.id);

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
  const osId = useSignal<string | undefined>(undefined);

  const state: SettingsState = { theme, installGroups, osId };
  useContextProvider(SettingsContext, state);

  const hydrated = useSignal(false);

  // Load persisted state on mount, then persist on every subsequent change.
  useVisibleTask$(({ track }) => {
    track(() => theme.value);
    track(() => JSON.stringify(installGroups.value));
    track(() => osId.value);

    if (!hydrated.value) {
      hydrated.value = true;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const stored = raw ? safeJsonParse<Partial<PersistedSettings>>(raw) : null;
        if (stored) {
          if (stored.theme) theme.value = stored.theme;
          if (isCurrentShape(stored.installGroups)) {
            installGroups.value = mergeInstallGroups(stored.installGroups, defaultInstallGroups());
          }
          if (typeof stored.osId === "string") osId.value = stored.osId;
        }
      } catch {
        // localStorage itself unavailable (private-browsing edge cases,
        // site data blocked, ...) — safeJsonParse already handles bad
        // JSON without throwing, this only guards getItem itself.
      }
      return;
    }

    const payload: PersistedSettings = {
      theme: theme.value,
      installGroups: installGroups.value,
      osId: osId.value,
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

/** Sets one group's Show/Hide tri-state directly (the OS Selector and Sources tabs both offer all three choices, not just a flip). */
export const setGroupShown = (
  installGroups: Signal<InstallFormatGroup[]>,
  index: number,
  shown: TriState,
) => {
  installGroups.value = installGroups.value.map((group, i) =>
    i === index ? { ...group, shown } : group,
  );
};

/**
 * Marks one special-repo leaf's tri-state — looked up by its own `id`
 * rather than group/index, since callers like the install drawer work from
 * a `PackageSourceId`, not a position in the settings list. The same
 * mutator backs the Settings page's tri-state control, the OS Selector
 * tab's, and the drawer's "I've already done this" button (which always
 * passes "on" — a real user confirmation, not a guess); a no-op if the id
 * isn't found.
 */
export const setSourceActivated = (
  installGroups: Signal<InstallFormatGroup[]>,
  sourceId: string,
  activated: TriState,
) => {
  installGroups.value = installGroups.value.map((group) => ({
    ...group,
    specialRepos: group.specialRepos.map((repo) =>
      repo.id === sourceId ? { ...repo, activated } : repo,
    ),
  }));
};

/**
 * The subset of `installGroups` matching `predicate`, each paired with its
 * own index into the *original* list — `InstallGroupList`'s rows mutate a
 * group by that original index (`GroupShownControl`), not by a position
 * within whatever filtered/scoped subset the Settings page happens to be
 * rendering (cross-distro vs. distro packages, or one OS's recommended
 * set), so the index has to survive the filter.
 */
export function groupsWhere(
  installGroups: InstallFormatGroup[],
  predicate: (group: InstallFormatGroup) => boolean,
): { group: InstallFormatGroup; index: number }[] {
  return installGroups
    .map((group, index) => ({ group, index }))
    .filter(({ group }) => predicate(group));
}

/**
 * Resolves a group's Show/Hide tri-state to a real boolean — "auto" defers
 * to `recommendedGroupIds` (the selected OS's own recommendation, see
 * `~/os-catalog`'s `recommendedGroupIds`), or shows everything when
 * `undefined` (no OS selected yet — the original, pre-OS-Selector
 * behavior). "off"/"on" always win outright, regardless of the OS.
 */
export function isGroupEffectivelyShown(
  group: InstallFormatGroup,
  recommendedGroupIds: Set<string> | undefined,
): boolean {
  if (group.shown === "off") return false;
  if (group.shown === "on") return true;
  return recommendedGroupIds ? recommendedGroupIds.has(group.id) : true;
}

/**
 * Resolves a special repo's tri-state to a real boolean — the same
 * "auto" defers to the selected OS" reasoning as `isGroupEffectivelyShown`,
 * except "auto" with no OS selected resolves to `false` (not preactivated
 * — the original, pre-OS-Selector default, since nothing was ever assumed
 * set up before this feature existed).
 */
export function isRepoEffectivelyActivated(
  repo: SpecialRepoOption,
  preActivatedRepoIds: Set<string> | undefined,
): boolean {
  if (repo.activated === "off") return false;
  if (repo.activated === "on") return true;
  return preActivatedRepoIds ? preActivatedRepoIds.has(repo.id) : false;
}

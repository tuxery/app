import { component$, useSignal, type Signal } from "@qwik.dev/core";
import { useLocation } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import { LuCheck, LuCopy, LuMonitor, LuMoon, LuSun } from "@qwikest/icons/lucide";
import { requestAdditionUrl } from "~/contribute-links";
import { Logo } from "~/components/logo/logo";
import { INSTALL_GROUP_LOGOS, OS_LOGOS } from "~/data/logos";
import {
  findOsEntry,
  recommendedGroupIds,
  OS_CATALOG,
  OS_FAMILIES,
  type OsCatalogEntry,
} from "~/os-catalog";
import {
  CROSS_DISTRO_GROUP_IDS,
  groupsWhere,
  isGroupEffectivelyShown,
  isRepoEffectivelyActivated,
  resetSettings,
  setGroupShown,
  setSourceActivated,
  useSettings,
  type InstallFormatGroup,
  type Theme,
  type TriState,
} from "~/settings";
import { autoActivatedNote, autoShownNote } from "~/settings-auto";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "Match system" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// Picked by value rather than stored on THEME_OPTIONS: a component function
// inside the options would be captured by the buttons' `onClick$`, which
// Qwik can't serialize (Q34).
const ThemeIcon = ({ theme }: { theme: Theme }) => {
  if (theme === "light") return <LuSun class="text-sm" />;
  if (theme === "dark") return <LuMoon class="text-sm" />;
  return <LuMonitor class="text-sm" />;
};

// Same three underlying TriState values, worded per what the control
// actually asks — "Off/Auto/On" read as one generic toggle language for
// two genuinely different questions ("is this source relevant to you?"
// vs. "have you done the one-time setup?").
const SHOWN_OPTIONS: { value: TriState; label: string }[] = [
  { value: "off", label: "Hide" },
  { value: "auto", label: "Auto" },
  { value: "on", label: "Show" },
];
const ACTIVATED_OPTIONS: { value: TriState; label: string }[] = [
  { value: "off", label: "No" },
  { value: "auto", label: "Auto" },
  { value: "on", label: "Done" },
];

/**
 * Hide/Auto/Show for one `InstallFormatGroup.shown`, looked up by `index`
 * from the live signal on every render (not received as a plain `value`
 * prop computed by a parent — a `component$` child that only *received*
 * one didn't reliably pick up a fresh value after `installGroups` changed
 * out from under it via a parent re-render, e.g. loading persisted state
 * on mount — same fix as `SourceTabBar` on the fiche page, which reads
 * its own `Signal` directly for the same reason). The button markup is
 * duplicated with `RepoActivatedControl` below rather than factored into
 * a shared helper — Qwik's `onClick$` needs to be transformed by its
 * optimizer, which only reliably reaches inside a `component$`'s own
 * render body, not a plain function it merely calls into.
 */
const GroupShownControl = component$<{
  installGroups: Signal<InstallFormatGroup[]>;
  index: number;
  label: string;
}>(({ installGroups, index, label }) => {
  const value = installGroups.value[index]?.shown ?? "auto";
  return (
    <fieldset class="join shrink-0">
      <legend class="sr-only">Show {label}</legend>
      {SHOWN_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          class={["btn btn-xs join-item", value === option.value ? "btn-primary" : "btn-ghost"]}
          onClick$={() => setGroupShown(installGroups, index, option.value)}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
});

/** No/Auto/Done for one `SpecialRepoOption.activated`, looked up by `repoId` from the live signal on every render — see `GroupShownControl`'s doc comment for why. */
const RepoActivatedControl = component$<{
  installGroups: Signal<InstallFormatGroup[]>;
  repoId: string;
  label: string;
}>(({ installGroups, repoId, label }) => {
  const repo = installGroups.value
    .flatMap((group) => group.specialRepos)
    .find((r) => r.id === repoId);
  const value = repo?.activated ?? "auto";
  return (
    <fieldset class="join shrink-0">
      <legend class="sr-only">{label} activated</legend>
      {ACTIVATED_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          class={["btn btn-xs join-item", value === option.value ? "btn-primary" : "btn-ghost"]}
          onClick$={() => setSourceActivated(installGroups, repoId, option.value)}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
});

/**
 * A setup command, kept on one line (scrolling sideways when long — a
 * command wrapped mid-word was hard to read and to select) with a button
 * copying it exactly.
 */
const CommandBlock = component$<{ command: string }>(({ command }) => {
  const copied = useSignal(false);
  return (
    <div class="flex items-start gap-2 bg-base-100 border border-base-300 rounded-field">
      <pre class="grow min-w-0 overflow-x-auto px-2 py-1.5 text-xs font-mono">
        <code>{command}</code>
      </pre>
      <button
        type="button"
        class="btn btn-ghost btn-xs gap-1 shrink-0 m-0.5"
        onClick$={async () => {
          await navigator.clipboard.writeText(command);
          copied.value = true;
          setTimeout(() => (copied.value = false), 2000);
        }}
      >
        {copied.value ? <LuCheck class="text-sm" /> : <LuCopy class="text-sm" />}
        <span aria-live="polite">{copied.value ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
});

type TabId = "os" | "sources" | "display";

function parseTab(value: string | null): TabId {
  return value === "sources" || value === "display" ? value : "os";
}

interface InstallGroupListProps {
  title: string;
  description?: string;
  groups: { group: InstallFormatGroup; index: number }[];
  /** The selected OS's recommendation, or `undefined` with none selected — see `isGroupEffectivelyShown`. */
  recommended: Set<string> | undefined;
  preActivated: Set<string> | undefined;
  /** The selected OS's name, for the "Auto: …" notes. */
  osLabel: string | undefined;
}

/**
 * One section per list: a heading and a sentence saying what it holds,
 * then a row per group — logo, label, what Auto resolves to, and the
 * Hide/Auto/Show control on the right — separated by thin rules rather
 * than boxed. A group's one-time setups sit under its label in a tinted
 * panel, each with the same label-left/control-right layout, so every
 * control lines up whatever the label's length.
 */
const InstallGroupList = component$<InstallGroupListProps>(
  ({ title, description, groups, recommended, preActivated, osLabel }) => {
    const settings = useSettings();

    return (
      <section class="flex flex-col gap-2">
        <div>
          <h2 class="font-semibold">{title}</h2>
          {description && <p class="text-sm text-base-content/70">{description}</p>}
        </div>
        <ul class="divide-y divide-base-300 border-y border-base-300">
          {groups.map(({ group, index }) => {
            const shown = isGroupEffectivelyShown(group, recommended);
            return (
              <li key={group.id} class="py-3 flex flex-col gap-3">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="w-5 shrink-0 flex justify-center">
                      <Logo
                        slug={INSTALL_GROUP_LOGOS[group.id]}
                        class="w-5 h-5 text-base-content/70"
                      />
                    </span>
                    <div class="min-w-0">
                      <p class="font-medium text-sm">{group.label}</p>
                      {group.shown === "auto" && (
                        <p class="text-xs text-base-content/70">
                          {autoShownNote(group.id, recommended, osLabel)}
                        </p>
                      )}
                    </div>
                  </div>
                  <GroupShownControl
                    installGroups={settings.installGroups}
                    index={index}
                    label={group.label}
                  />
                </div>

                {shown && group.specialRepos.length > 0 && (
                  <ul class="ml-8 flex flex-col gap-3 bg-base-200/60 rounded-box p-3">
                    {group.specialRepos.map((repo) => {
                      const activated = isRepoEffectivelyActivated(repo, preActivated);
                      return (
                        <li key={repo.id} class="flex flex-col gap-2">
                          <div class="flex items-center justify-between gap-3">
                            <div class="min-w-0">
                              <p class="text-sm">{repo.label}</p>
                              {repo.activated === "auto" && (
                                <p class="text-xs text-base-content/70">
                                  {autoActivatedNote(repo.id, preActivated, osLabel)}
                                </p>
                              )}
                            </div>
                            <RepoActivatedControl
                              installGroups={settings.installGroups}
                              repoId={repo.id}
                              label={repo.label}
                            />
                          </div>
                          {!activated && (
                            <div class="flex flex-col gap-1.5">
                              <p class="text-xs text-base-content/70">{repo.setup.note}</p>
                              {repo.setup.kind === "link" ? (
                                <a
                                  href={repo.setup.url}
                                  class="link link-primary text-xs break-all"
                                  target="_blank"
                                  rel="noopener"
                                >
                                  {repo.setup.url}
                                </a>
                              ) : (
                                <CommandBlock command={repo.setup.command} />
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  },
);

const SourcesTab = component$(() => {
  const settings = useSettings();
  const selectedOs = findOsEntry(settings.osId.value);
  const recommended = selectedOs ? recommendedGroupIds(selectedOs) : undefined;
  const preActivated = selectedOs ? new Set(selectedOs.preActivatedRepoIds) : undefined;

  return (
    <section class="flex flex-col gap-3">
      <p class="text-sm text-base-content/70">
        Choose which install methods Tuxery shows you, and which one-time setups you've already
        done. <strong>Auto</strong> follows your{" "}
        <a href="?tab=os" class="link link-primary">
          operating system
        </a>
        {selectedOs ? ` (${selectedOs.label})` : ""}; any other choice always wins.
        {!selectedOs && " With none picked, Auto shows everything and assumes nothing is set up."}
      </p>
      <div class="flex flex-col gap-8 mt-2">
        <InstallGroupList
          title="Cross-distro formats"
          description="Work the same on any distribution."
          groups={groupsWhere(settings.installGroups.value, (group) =>
            CROSS_DISTRO_GROUP_IDS.has(group.id),
          )}
          recommended={recommended}
          preActivated={preActivated}
          osLabel={selectedOs?.label}
        />
        <InstallGroupList
          title="Distro packages"
          description="Each distribution's own repositories."
          groups={groupsWhere(
            settings.installGroups.value,
            (group) => !CROSS_DISTRO_GROUP_IDS.has(group.id),
          )}
          recommended={recommended}
          preActivated={preActivated}
          osLabel={selectedOs?.label}
        />
      </div>
    </section>
  );
});

/** Back to defaults, behind a confirmation — it also forgets the picked OS. */
const ResetSettings = component$(() => {
  const settings = useSettings();
  const confirming = useSignal(false);
  const done = useSignal(false);

  return (
    <li class="p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div class="min-w-0">
        <p class="font-medium text-sm">Reset all settings</p>
        <p class="text-xs text-base-content/70" aria-live="polite">
          {done.value
            ? "Done — back to the defaults."
            : "Forgets your operating system, your source choices and your theme, as on a first visit."}
        </p>
      </div>
      {confirming.value ? (
        <div class="flex gap-1 shrink-0">
          <button
            type="button"
            class="btn btn-xs btn-error"
            onClick$={() => {
              resetSettings(settings);
              confirming.value = false;
              done.value = true;
            }}
          >
            Yes, reset
          </button>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            onClick$={() => (confirming.value = false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          class="btn btn-xs btn-outline shrink-0"
          onClick$={() => {
            confirming.value = true;
            done.value = false;
          }}
        >
          Reset…
        </button>
      )}
    </li>
  );
});

const DisplayTab = component$(() => {
  const settings = useSettings();

  return (
    <section class="flex flex-col gap-6">
      <div>
        <h3 class="text-xs font-semibold text-base-content/70 uppercase tracking-wide mb-2">
          Appearance
        </h3>
        <ul class="bg-base-100 border border-base-300 rounded-box">
          <li class="p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div class="min-w-0">
              <p class="font-medium text-sm">Theme</p>
              <p class="text-xs text-base-content/70">
                "Match system" follows your device's light or dark mode.
              </p>
            </div>
            <fieldset class="join shrink-0">
              <legend class="sr-only">Theme</legend>
              {THEME_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={settings.theme.value === value}
                  class={[
                    "btn btn-xs join-item gap-1",
                    settings.theme.value === value ? "btn-primary" : "btn-ghost",
                  ]}
                  onClick$={() => {
                    settings.theme.value = value;
                  }}
                >
                  <ThemeIcon theme={value} />
                  {label}
                </button>
              ))}
            </fieldset>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="text-xs font-semibold text-base-content/70 uppercase tracking-wide mb-2">
          Your settings
        </h3>
        <ul class="bg-base-100 border border-base-300 rounded-box">
          <ResetSettings />
        </ul>
        <p class="text-xs text-base-content/70 mt-2">
          Every setting is saved in this browser only — never sent to Tuxery's server. See the{" "}
          <a href="/docs/legal/#privacy" class="link link-primary">
            privacy policy
          </a>
          .
        </p>
      </div>
    </section>
  );
});

/**
 * State 2 of the OS Selector tab (see `OsSelectorTab`) — the chosen OS, big
 * and central, with a way back to state 1 and every source it recommends
 * (its own native group plus the six cross-distro ones) shown inline with
 * the exact same tri-state rows the Sources tab uses — same widget, same
 * data, just pre-scoped to this OS instead of split cross-distro/distro.
 */
const OsJumbo = component$<{ entry: OsCatalogEntry }>(({ entry }) => {
  const settings = useSettings();
  const recommended = recommendedGroupIds(entry);
  const preActivated = new Set(entry.preActivatedRepoIds);
  const groups = groupsWhere(settings.installGroups.value, (group) => recommended.has(group.id));

  return (
    <div class="flex flex-col gap-6">
      <div class="hero bg-base-200 rounded-box py-10">
        <div class="hero-content text-center flex-col gap-3">
          <Logo slug={OS_LOGOS[entry.id]} class="w-12 h-12 text-base-content/70" />
          <p class="text-xs font-semibold text-base-content/70 uppercase tracking-wide">Your OS</p>
          <h2 class="text-3xl font-bold">{entry.label}</h2>
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            onClick$={() => (settings.osId.value = undefined)}
          >
            Change
          </button>
        </div>
      </div>

      <InstallGroupList
        title="Recommended sources"
        groups={groups}
        recommended={recommended}
        preActivated={preActivated}
        osLabel={entry.label}
      />
    </div>
  );
});

/**
 * State 1 of the OS Selector tab — every `~/os-catalog` entry as a tile,
 * grouped by lineage (`OS_FAMILIES`) under a heading each; picking one
 * moves to `OsJumbo`. Tiles are light (no border until hovered) so the
 * groups read as groups rather than one wall of boxes.
 */
const OsTileGrid = component$(() => {
  const settings = useSettings();
  const byId = new Map(OS_CATALOG.map((entry) => [entry.id, entry]));

  return (
    <div class="flex flex-col gap-6">
      {OS_FAMILIES.map((family) => (
        <section key={family.title} class="flex flex-col gap-2">
          <h2 class="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
            {family.title}
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {family.osIds.map((id) => {
              const entry = byId.get(id);
              if (!entry) return null;
              return (
                <button
                  key={entry.id}
                  type="button"
                  class="flex items-center gap-3 rounded-box border border-transparent bg-base-200/60 hover:bg-base-200 hover:border-base-300 px-3 py-3 text-sm font-medium text-left transition-colors"
                  onClick$={() => (settings.osId.value = entry.id)}
                >
                  <Logo slug={OS_LOGOS[entry.id]} class="w-6 h-6 shrink-0 text-base-content/70" />
                  {entry.label}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <p class="text-sm text-base-content/70">
        Your distribution isn't listed?{" "}
        <a href={requestAdditionUrl()} target="_blank" rel="noopener" class="link link-primary">
          Ask for it
        </a>{" "}
        — the closest one above usually works meanwhile.
      </p>
    </div>
  );
});

const OsSelectorTab = component$(() => {
  const settings = useSettings();
  const entry = findOsEntry(settings.osId.value);

  return (
    <section class="flex flex-col gap-4">
      <p class="text-sm text-base-content/70">
        Pick your operating system: Tuxery then shows the install methods that work on it, and knows
        which setups it already comes with. It only fills in what you've left on "Auto" in{" "}
        <a href="?tab=sources" class="link link-primary">
          Sources
        </a>
        .
      </p>
      {entry ? <OsJumbo entry={entry} /> : <OsTileGrid />}
    </section>
  );
});

const TABS: { id: TabId; label: string }[] = [
  { id: "os", label: "Operating system" },
  { id: "sources", label: "Sources" },
  { id: "display", label: "Display" },
];

export default component$(() => {
  const location = useLocation();
  const tab = parseTab(location.url.searchParams.get("tab"));

  return (
    <div class="flex flex-col gap-6 max-w-3xl">
      <h1 class="text-3xl font-bold">Settings</h1>

      {/* Plain links styled as tabs, not an ARIA tablist: each section is
          its own URL (?tab=...), and role="tab" would promise arrow-key
          navigation and aria-selected these links don't have. */}
      <nav class="tabs tabs-border" aria-label="Settings sections">
        {TABS.map((t) => (
          <a
            key={t.id}
            href={`?tab=${t.id}`}
            class={["tab", tab === t.id && "tab-active"]}
            aria-current={tab === t.id ? "page" : undefined}
          >
            {t.label}
          </a>
        ))}
      </nav>

      {tab === "os" && <OsSelectorTab />}
      {tab === "sources" && <SourcesTab />}
      {tab === "display" && <DisplayTab />}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Settings — Tuxery",
};

import { component$, type Signal } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { findOsEntry, recommendedGroupIds, OS_CATALOG, type OsCatalogEntry } from "~/os-catalog";
import {
  CROSS_DISTRO_GROUP_IDS,
  groupsWhere,
  isGroupEffectivelyShown,
  isRepoEffectivelyActivated,
  setGroupShown,
  setSourceActivated,
  useSettings,
  type InstallFormatGroup,
  type Theme,
  type TriState,
} from "~/settings";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "Match system" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

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
    <div class="join" aria-label={`Show ${label}`}>
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
    </div>
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
    <div class="join" aria-label={`${label} activated`}>
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
    </div>
  );
});

type TabId = "os" | "sources" | "display";

function parseTab(value: string | null): TabId {
  return value === "sources" || value === "display" ? value : "os";
}

interface InstallGroupListProps {
  title: string;
  groups: { group: InstallFormatGroup; index: number }[];
  /** The selected OS's recommendation, or `undefined` with none selected — see `isGroupEffectivelyShown`. */
  recommended: Set<string> | undefined;
  preActivated: Set<string> | undefined;
}

const InstallGroupList = component$<InstallGroupListProps>(
  ({ title, groups, recommended, preActivated }) => {
    const settings = useSettings();

    return (
      <div>
        <h3 class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">
          {title}
        </h3>
        <ul class="list bg-base-100 border border-base-300 rounded-box">
          {groups.map(({ group, index }) => {
            const shown = isGroupEffectivelyShown(group, recommended);
            return (
              <li key={group.id} class="list-row items-center">
                <span class="font-medium text-sm">{group.label}</span>
                <GroupShownControl
                  installGroups={settings.installGroups}
                  index={index}
                  label={group.label}
                />

                {shown && group.specialRepos.length > 0 && (
                  <div class="list-col-wrap flex flex-col gap-2 pt-2">
                    {group.specialRepos.map((repo) => {
                      const activated = isRepoEffectivelyActivated(repo, preActivated);
                      return (
                        <div key={repo.id} class="flex flex-col gap-1">
                          <div class="flex items-center justify-between gap-2 text-sm">
                            <span>{repo.label}</span>
                            <RepoActivatedControl
                              installGroups={settings.installGroups}
                              repoId={repo.id}
                              label={repo.label}
                            />
                          </div>
                          {!activated && (
                            <div class="flex flex-col gap-1 bg-base-200 rounded-field p-2">
                              <p class="text-xs text-base-content/60">{repo.setup.note}</p>
                              {repo.setup.kind === "link" ? (
                                <a
                                  href={repo.setup.url}
                                  class="link link-primary text-xs"
                                  target="_blank"
                                  rel="noopener"
                                >
                                  {repo.setup.url}
                                </a>
                              ) : (
                                <code class="text-xs font-mono break-all">
                                  {repo.setup.command}
                                </code>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
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
      <p class="text-sm text-base-content/60">
        Hide/Show always win, regardless of your OS. Auto follows whatever the{" "}
        <a href="?tab=os" class="link link-primary">
          Operating system
        </a>{" "}
        tab has selected — or, with none selected, shows everything and assumes nothing's set up
        yet, same as before this tab existed.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InstallGroupList
          title="Cross-distro formats"
          groups={groupsWhere(settings.installGroups.value, (group) =>
            CROSS_DISTRO_GROUP_IDS.has(group.id),
          )}
          recommended={recommended}
          preActivated={preActivated}
        />
        <InstallGroupList
          title="Distro packages"
          groups={groupsWhere(
            settings.installGroups.value,
            (group) => !CROSS_DISTRO_GROUP_IDS.has(group.id),
          )}
          recommended={recommended}
          preActivated={preActivated}
        />
      </div>
    </section>
  );
});

const DisplayTab = component$(() => {
  const settings = useSettings();

  return (
    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-semibold">Theme</h2>
      <div class="join">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            class={[
              "btn join-item",
              settings.theme.value === option.value ? "btn-primary" : "btn-ghost",
            ]}
            onClick$={() => {
              settings.theme.value = option.value;
            }}
          >
            {option.label}
          </button>
        ))}
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
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Your OS</p>
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
      />
    </div>
  );
});

/** State 1 of the OS Selector tab — every `~/os-catalog` entry as a small tile, picking one moves to `OsJumbo`. */
const OsTileGrid = component$(() => {
  const settings = useSettings();

  return (
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {OS_CATALOG.map((entry) => (
        <button
          key={entry.id}
          type="button"
          class="card bg-base-100 border border-base-300 hover:border-primary/40 hover:shadow-md transition-shadow p-4 text-sm font-medium text-center"
          onClick$={() => (settings.osId.value = entry.id)}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
});

const OsSelectorTab = component$(() => {
  const settings = useSettings();
  const entry = findOsEntry(settings.osId.value);

  return (
    <section class="flex flex-col gap-4">
      <p class="text-sm text-base-content/60">
        Picking an OS pre-fills the Sources tab's "Auto" choices — it never overrides a choice
        you've made explicitly yourself.
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

      <div role="tablist" class="tabs tabs-border">
        {TABS.map((t) => (
          <a
            key={t.id}
            href={`?tab=${t.id}`}
            role="tab"
            class={["tab", tab === t.id && "tab-active"]}
          >
            {t.label}
          </a>
        ))}
      </div>

      {tab === "os" && <OsSelectorTab />}
      {tab === "sources" && <SourcesTab />}
      {tab === "display" && <DisplayTab />}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Settings — Tuxery",
};

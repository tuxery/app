import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  setSourceActivated,
  toggleGroupShown,
  useSettings,
  type InstallFormatGroup,
  type Theme,
} from "~/settings";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "Match system" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// Cross-distro packaging formats (install once, works the same on any
// distro) vs. a single distro's own native package manager — same split
// the user thinks in, not a data-model concept from `~/catalog-types`.
const COMPOSITE_GROUP_IDS = new Set(["Flatpak", "Snap", "AppImage", "GOG", "Lutris"]);

interface InstallGroupListProps {
  title: string;
  groups: { group: InstallFormatGroup; index: number }[];
}

const InstallGroupList = component$<InstallGroupListProps>(({ title, groups }) => {
  const settings = useSettings();

  return (
    <div>
      <h3 class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <ul class="list bg-base-100 border border-base-300 rounded-box">
        {groups.map(({ group, index }) => (
          <li key={group.id} class="list-row items-center">
            <span class="font-medium text-sm">{group.label}</span>
            <input
              type="checkbox"
              class="toggle toggle-primary justify-self-end"
              checked={group.shown}
              onChange$={() => toggleGroupShown(settings.installGroups, index)}
              aria-label={`Show ${group.label}`}
            />

            {group.shown && group.specialRepos.length > 0 && (
              <div class="list-col-wrap flex flex-col gap-2 pt-2">
                {group.specialRepos.map((repo) => (
                  <div key={repo.id} class="flex flex-col gap-1">
                    <label class="flex items-center justify-between gap-2 cursor-pointer text-sm">
                      {repo.label}
                      <input
                        type="checkbox"
                        class="toggle toggle-sm toggle-secondary"
                        checked={repo.activated}
                        onChange$={() =>
                          setSourceActivated(settings.installGroups, repo.id, !repo.activated)
                        }
                      />
                    </label>
                    {!repo.activated && (
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
                          <code class="text-xs font-mono break-all">{repo.setup.command}</code>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
});

export default component$(() => {
  const settings = useSettings();

  return (
    <div class="flex flex-col gap-10 max-w-3xl">
      <h1 class="text-3xl font-bold">Settings</h1>

      <section>
        <h2 class="text-lg font-semibold mb-3">Theme</h2>
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

      <section>
        <h2 class="text-lg font-semibold mb-3">Install sources</h2>
        <p class="text-sm text-base-content/60 mb-3">
          Show or hide each format/distro on an app's page. A special repo needs a one-time step
          before it's usable — check it off once you've done that (or confirm it from an app's own
          install drawer, wherever it shows there too).
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InstallGroupList
            title="Cross-distro formats"
            groups={settings.installGroups.value
              .map((group, index) => ({ group, index }))
              .filter(({ group }) => COMPOSITE_GROUP_IDS.has(group.id))}
          />
          <InstallGroupList
            title="Distro packages"
            groups={settings.installGroups.value
              .map((group, index) => ({ group, index }))
              .filter(({ group }) => !COMPOSITE_GROUP_IDS.has(group.id))}
          />
        </div>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Settings — Tuxery",
};

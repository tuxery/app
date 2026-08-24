import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { setSourceActivated, toggleGroupShown, useSettings, type Theme } from "~/settings";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "Match system" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default component$(() => {
  const settings = useSettings();

  return (
    <div class="flex flex-col gap-10 max-w-xl">
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
        <ul class="flex flex-col gap-2">
          {settings.installGroups.value.map((group, groupIndex) => (
            <li key={group.id} class="border border-base-300 rounded-box px-3 py-2">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  class="checkbox checkbox-primary"
                  checked={group.shown}
                  onChange$={() => toggleGroupShown(settings.installGroups, groupIndex)}
                  aria-label={`Show ${group.label}`}
                />
                <span class="flex-1 font-medium">{group.label}</span>
              </label>

              {group.shown && group.specialRepos.length > 0 && (
                <ul class="flex flex-col gap-2 mt-2 pl-8">
                  {group.specialRepos.map((repo) => (
                    <li key={repo.id}>
                      <label class="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          class="checkbox checkbox-sm checkbox-primary"
                          checked={repo.activated}
                          onChange$={() =>
                            setSourceActivated(settings.installGroups, repo.id, !repo.activated)
                          }
                        />
                        {repo.label}
                      </label>
                      {!repo.activated && (
                        <div class="mt-1 flex flex-col gap-1 bg-base-200 rounded-field p-2">
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
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Settings — Tuxery",
};

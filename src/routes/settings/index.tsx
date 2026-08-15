import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuArrowDown, LuArrowUp } from "@qwikest/icons/lucide";
import {
  reorderInstallGroup,
  toggleInstallGroup,
  toggleInstallSource,
  useSettings,
  type CtaBehavior,
  type Theme,
} from "~/settings";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "Match system" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const CTA_OPTIONS: { value: CtaBehavior; label: string; hint: string }[] = [
  { value: "exhaustive", label: "Exhaustive", hint: "Show every available source as an equal install option." },
  {
    value: "automatic",
    label: "Automatic",
    hint: "Show the single best-matching source as the main install button.",
  },
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
              class={["btn join-item", settings.theme.value === option.value ? "btn-primary" : "btn-ghost"]}
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
        <h2 class="text-lg font-semibold mb-3">Install button behavior</h2>
        <div class="flex flex-col gap-2">
          {CTA_OPTIONS.map((option) => (
            <label key={option.value} class="flex items-start gap-3 cursor-pointer" aria-label={option.label}>
              <input
                type="radio"
                name="cta-behavior"
                class="radio radio-primary mt-1"
                checked={settings.ctaBehavior.value === option.value}
                onChange$={() => {
                  settings.ctaBehavior.value = option.value;
                }}
              />
              <span>
                <span class="font-medium">{option.label}</span>
                <p class="text-sm text-base-content/60">{option.hint}</p>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-3">Install sources</h2>
        <p class="text-sm text-base-content/60 mb-3">
          Order and enable the formats/distros shown on each app's page. Expand one to pick which
          of its sources to use.
        </p>
        <ul class="flex flex-col gap-2">
          {settings.installGroups.value.map((group, groupIndex) => (
            <li key={group.id} class="border border-base-300 rounded-box px-3 py-2">
              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  class="checkbox checkbox-primary"
                  checked={group.enabled}
                  onChange$={() => toggleInstallGroup(settings.installGroups, groupIndex)}
                  aria-label={`Enable ${group.label}`}
                />
                <span class="flex-1 font-medium">{group.label}</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-square btn-sm"
                  disabled={groupIndex === 0}
                  aria-label={`Move ${group.label} up`}
                  onClick$={() => reorderInstallGroup(settings.installGroups, groupIndex, -1)}
                >
                  <LuArrowUp />
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-square btn-sm"
                  disabled={groupIndex === settings.installGroups.value.length - 1}
                  aria-label={`Move ${group.label} down`}
                  onClick$={() => reorderInstallGroup(settings.installGroups, groupIndex, 1)}
                >
                  <LuArrowDown />
                </button>
              </div>

              {group.enabled && group.sources.length > 0 && (
                <ul class="flex flex-col gap-1.5 mt-2 pl-8">
                  {group.sources.map((source, sourceIndex) => (
                    <li key={source.id}>
                      <label class="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          class="checkbox checkbox-sm checkbox-primary"
                          checked={source.enabled}
                          onChange$={() => toggleInstallSource(settings.installGroups, groupIndex, sourceIndex)}
                        />
                        {source.label}
                      </label>
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

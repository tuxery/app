import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuArrowDown, LuArrowUp } from "@qwikest/icons/lucide";
import {
  INSTALL_METHOD_LABELS,
  reorderInstallMethod,
  toggleInstallMethod,
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
  { value: "automatic", label: "Automatic", hint: "Show the single best-matching source as the main install button." },
  { value: "exhaustive", label: "Exhaustive", hint: "Show every available source as an equal install option." },
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
          Order and enable the sources shown on each app's page. Disabled sources are hidden.
        </p>
        <ul class="flex flex-col gap-2">
          {settings.installMethods.value.map((method, index) => (
            <li
              key={method.id}
              class="flex items-center gap-3 border border-base-300 rounded-box px-3 py-2"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-primary"
                checked={method.enabled}
                onChange$={() => toggleInstallMethod(settings.installMethods, index)}
                aria-label={`Enable ${INSTALL_METHOD_LABELS[method.id]}`}
              />
              <span class="flex-1">{INSTALL_METHOD_LABELS[method.id]}</span>
              <button
                type="button"
                class="btn btn-ghost btn-square btn-sm"
                disabled={index === 0}
                aria-label={`Move ${INSTALL_METHOD_LABELS[method.id]} up`}
                onClick$={() => reorderInstallMethod(settings.installMethods, index, -1)}
              >
                <LuArrowUp />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-square btn-sm"
                disabled={index === settings.installMethods.value.length - 1}
                aria-label={`Move ${INSTALL_METHOD_LABELS[method.id]} down`}
                onClick$={() => reorderInstallMethod(settings.installMethods, index, 1)}
              >
                <LuArrowDown />
              </button>
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

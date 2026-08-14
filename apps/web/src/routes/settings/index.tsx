import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuChevronDown, LuChevronUp } from "@qwikest/icons/lucide";
import {
  INSTALL_METHOD_LABELS,
  reorderInstallMethod,
  toggleInstallMethod,
  useSettings,
  type CtaBehavior,
  type Theme,
} from "~/settings";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const CTA_OPTIONS: { value: CtaBehavior; label: string }[] = [
  { value: "automatic", label: "Automatic" },
  { value: "exhaustive", label: "Exhaustive" },
];

export default component$(() => {
  const settings = useSettings();

  return (
    <>
      <h1 class="text-2xl font-bold mb-8">Settings</h1>

      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-1">Theme</h2>
        <p class="text-sm text-base-content/70 mb-3">Applies immediately, no reload needed.</p>
        <div class="join" role="radiogroup" aria-label="Theme">
          {THEME_OPTIONS.map((opt) => (
            <input
              key={opt.value}
              type="radio"
              name="theme"
              class="btn join-item checked:btn-primary"
              aria-label={opt.label}
              checked={settings.theme.value === opt.value}
              onChange$={() => {
                settings.theme.value = opt.value;
              }}
            />
          ))}
        </div>
      </section>

      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-1">Install button behavior</h2>
        <p class="text-sm text-base-content/70 mb-3">
          Automatic: installs with one click when a direct link is available, otherwise confirms
          via a dialog. Exhaustive: always shows every install method to pick from.
        </p>
        <div class="join" role="radiogroup" aria-label="Install button behavior">
          {CTA_OPTIONS.map((opt) => (
            <input
              key={opt.value}
              type="radio"
              name="cta-behavior"
              class="btn join-item checked:btn-primary"
              aria-label={opt.label}
              checked={settings.ctaBehavior.value === opt.value}
              onChange$={() => {
                settings.ctaBehavior.value = opt.value;
              }}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-1">Install methods</h2>
        <p class="text-sm text-base-content/70 mb-3">
          Disabled methods are skipped by "Automatic". The order also sorts the list shown by
          "Exhaustive".
        </p>
        <div class="flex flex-col gap-2 max-w-md">
          {settings.installMethods.value.map((method, index) => (
            <div
              key={method.id}
              class={`flex items-center gap-3 rounded-box border border-base-300 bg-base-100 px-3 py-2 ${method.enabled ? "" : "opacity-55"}`}
            >
              <input
                type="checkbox"
                class="checkbox checkbox-primary"
                aria-label={`Enable ${INSTALL_METHOD_LABELS[method.id]}`}
                checked={method.enabled}
                onChange$={() => toggleInstallMethod(settings.installMethods, index)}
              />

              <span class="flex-1 text-sm">{INSTALL_METHOD_LABELS[method.id]}</span>

              <div class="join">
                <button
                  type="button"
                  class="btn btn-sm btn-ghost join-item"
                  disabled={index === 0}
                  aria-label={`Move ${INSTALL_METHOD_LABELS[method.id]} up`}
                  onClick$={() => reorderInstallMethod(settings.installMethods, index, -1)}
                >
                  <LuChevronUp />
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-ghost join-item"
                  disabled={index === settings.installMethods.value.length - 1}
                  aria-label={`Move ${INSTALL_METHOD_LABELS[method.id]} down`}
                  onClick$={() => reorderInstallMethod(settings.installMethods, index, 1)}
                >
                  <LuChevronDown />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
});

export const head: DocumentHead = {
  title: "Settings — Tuxery",
  meta: [{ name: "description", content: "Theme and install preferences for Tuxery." }],
};

import { component$, useSignal } from "@qwik.dev/core";
import { LuCheck } from "@qwikest/icons/lucide";
import { LogoChip } from "~/components/logo/logo";
import { OS_LOGOS } from "~/data/logos";
import { findOsEntry } from "~/os-catalog";
import { useSettings } from "~/settings";

/** The systems offered in one click; the others are behind "Other…" (the settings' full grid). */
export const QUICK_OS_IDS = ["ubuntu", "fedora", "linux-mint", "debian", "arch"] as const;

/**
 * The OS line under the homepage's search: every card's source icons
 * depend on the visitor's system, so it's asked for right where they
 * start. With none picked yet, one button per common system and "Other…";
 * once picked, a single "Install options for <OS> · Change" line. The
 * choice is the same `osId` setting as the header's "Select your OS",
 * kept in the browser, so the edge-cached page stays the same for
 * everyone: the line is empty, at its own height, until the saved
 * settings are read.
 */
export const OsLine = component$<{ align?: "center" | "start" }>(({ align = "center" }) => {
  const settings = useSettings();
  const changing = useSignal(false);
  const os = findOsEntry(settings.osId.value);
  return (
    <div
      class={[
        "min-h-8 mt-3 flex flex-wrap items-center gap-2 text-sm",
        align === "center" ? "justify-center" : "justify-start",
      ]}
    >
      {!settings.hydrated.value ? null : os && !changing.value ? (
        <>
          <LuCheck class="text-success" aria-hidden="true" />
          <span>Install options for</span>
          <span class="inline-flex items-center gap-1.5 font-semibold">
            <LogoChip slug={OS_LOGOS[os.id]} size="sm" />
            {os.label}
          </span>
          <button type="button" class="link link-primary" onClick$={() => (changing.value = true)}>
            Change
          </button>
        </>
      ) : (
        <>
          <span class="text-base-content/70">Your system:</span>
          {QUICK_OS_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={settings.osId.value === id}
              class="btn btn-xs h-7 rounded-full font-normal gap-1.5 pl-0.5"
              onClick$={() => {
                settings.osId.value = id;
                changing.value = false;
              }}
            >
              <LogoChip slug={OS_LOGOS[id]} size="sm" />
              {findOsEntry(id)?.label}
            </button>
          ))}
          <a href="/settings/?tab=os" class="btn btn-ghost btn-xs h-7 rounded-full font-normal">
            Other…
          </a>
        </>
      )}
    </div>
  );
});

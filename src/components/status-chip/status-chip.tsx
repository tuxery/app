import { component$ } from "@qwik.dev/core";
import { AVAILABILITY, type Availability, type Permission } from "~/data/source-gaps";

// One look per status, shared by /docs/source-gaps/ (table, legend, notes)
// and the per-source pages: a symbol (readable without color) on a tinted chip.
const STATUS: Record<Availability, { symbol: string; class: string }> = {
  yes: { symbol: "✓", class: "bg-success/15 text-success" },
  none: { symbol: "—", class: "text-base-content/40" },
  refused: { symbol: "✕", class: "bg-error/15 text-error" },
  waiting: { symbol: "…", class: "bg-warning/20 text-warning-content" },
  todo: { symbol: "+", class: "bg-info/15 text-info" },
  "kept-private": { symbol: "🔒", class: "bg-base-300 text-base-content/80" },
  "not-applicable": { symbol: "n/a", class: "text-base-content/40 text-[0.65rem]" },
};

/** The badge color of each permission state, for the same pages. */
export const PERMISSION_CLASS: Record<Permission, string> = {
  agreed: "badge-success",
  limited: "badge-warning",
  asked: "badge-info",
  "not-asked": "badge-ghost",
  "not-needed": "badge-ghost",
};

export const StatusChip = component$<{ status: Availability }>(({ status }) => (
  <span
    class={[
      "inline-flex items-center justify-center min-w-6 h-6 px-1 rounded-field text-xs font-semibold",
      STATUS[status].class,
    ]}
    title={AVAILABILITY[status].label}
  >
    <span aria-hidden="true">{STATUS[status].symbol}</span>
    <span class="sr-only">{AVAILABILITY[status].label}</span>
  </span>
));

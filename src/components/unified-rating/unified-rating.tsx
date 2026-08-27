import { component$ } from "@builder.io/qwik";
import { LuInfo } from "@qwikest/icons/lucide";
import type { SourceRating } from "~/catalog-types";

// Full literal class names, not a template-interpolated `dropdown-${...}` —
// Tailwind's static scanner needs each one spelled out verbatim in the
// source to generate its CSS at all. Same discipline as SourceSummary's
// TOOLTIP_POSITION_CLASSES.
const DROPDOWN_POSITION_CLASSES = {
  top: "dropdown-top",
  bottom: "dropdown-bottom",
  right: "dropdown-right",
} as const;

// Half-star granularity (10 positions across 5 stars) — the finest
// daisyUI's `rating-half` supports. `average` rarely lands on a clean half
// itself (e.g. 4.23), so this rounds to the nearest one purely for the
// *visual* stars; the exact figure stays next to them as text (normal
// mode) and in the `title` tooltip, nothing is hidden by rounding.
const STAR_HALVES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

function starsTitle(average: number, count: number, bySource: SourceRating[]): string {
  const base = `${average.toFixed(1)} out of 5 (${count.toLocaleString()} ratings)`;
  if (bySource.length < 2) return base;
  const lines = bySource.map(
    (s) => `${s.label}: ★ ${s.average.toFixed(1)} (${s.count.toLocaleString()})`,
  );
  return [base, "", "By source:", ...lines].join("\n");
}

export interface UnifiedRatingProps {
  average: number;
  count: number;
  /** Per-source breakdown for the info-icon dropdown — omitted or single-entry means nothing to disclose beyond the aggregate, so no icon is rendered. */
  bySource?: SourceRating[];
  /** "normal" (stars + figure, the fiche layout) or "short" (stars only, for cramped card rows). */
  mode?: "normal" | "short";
  /** Which side the dropdown opens toward — pick whichever has room in the surrounding layout. Purely cosmetic: the native `title` fallback below is what survives a clipping ancestor (a card's overflow-hidden, a horizontal-scroll row, ...). */
  tooltipPosition?: "top" | "bottom" | "right";
}

/**
 * The star-rating widget shown on an app's fiche (`/app/[id]`) and, in its
 * "short" mode, on listing cards — one component for both instead of the
 * fiche's old private `RatingStars` plus a separate always-visible
 * "Ratings by source" table row: the per-source breakdown now lives in this
 * component's own info-icon dropdown instead, so it's available in both
 * places without duplicating the same numbers twice on the fiche.
 *
 * Two tooltip mechanisms stacked on purpose, not redundant — same
 * reasoning as `SourceSummary`: the native `title` on the outer wrapper is
 * the reliable one (survives a clipping ancestor), the inner dropdown is
 * the richer one (a real aligned two-column grid, which a CSS
 * `content: attr()` tooltip can't render) for contexts with room for it.
 */
export const UnifiedRating = component$<UnifiedRatingProps>(
  ({ average, count, bySource = [], mode = "normal", tooltipPosition = "top" }) => {
    const rounded = Math.round(average * 2) / 2;
    const tip = starsTitle(average, count, bySource);

    return (
      <span class="inline-flex items-center gap-1.5" title={tip}>
        <div class="rating rating-xs rating-half" aria-hidden="true">
          {STAR_HALVES.map((position, i) => (
            <div
              key={position}
              class={[
                "mask mask-star-2",
                i % 2 === 0 ? "mask-half-1" : "mask-half-2",
                position <= rounded ? "bg-warning" : "bg-base-300",
              ]}
            />
          ))}
        </div>
        {mode === "normal" && (
          <span class="text-sm text-base-content/60">
            {average.toFixed(1)} ({count.toLocaleString()})
          </span>
        )}
        {bySource.length > 1 && (
          <div class={`dropdown dropdown-hover ${DROPDOWN_POSITION_CLASSES[tooltipPosition]}`}>
            <LuInfo class="text-sm text-base-content/50 cursor-help" />
            <div class="dropdown-content z-50 bg-base-100 rounded-box shadow-lg border border-base-300 p-2 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-sm whitespace-nowrap">
              {bySource.flatMap((s) => [
                <span key={`${s.label}-label`} class="text-base-content/70">
                  {s.label}
                </span>,
                <span key={`${s.label}-value`} class="text-right tabular-nums">
                  ★ {s.average.toFixed(1)} ({s.count.toLocaleString()})
                </span>,
              ])}
            </div>
          </div>
        )}
      </span>
    );
  },
);

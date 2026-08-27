import { component$ } from "@builder.io/qwik";
import type { SourceRating } from "~/catalog-types";
import { TOOLTIP_POSITION_CLASSES, type TooltipPosition } from "~/components/tooltip-position";

// Half-star granularity (10 positions across 5 stars) — the finest
// daisyUI's `rating-half` supports. `average` rarely lands on a clean half
// itself (e.g. 4.23), so this rounds to the nearest one purely for the
// *visual* stars; the exact figure stays next to them as text (normal
// mode) and in the tooltip, nothing is hidden by rounding.
const STAR_HALVES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

/** Every rated source, always prefixed by its own label — even a single one, so hovering a card whose aggregate came from just Flathub still says "Flathub", not a bare number with no source in sight. */
function starsTitle(average: number, count: number, bySource: SourceRating[]): string {
  if (bySource.length === 0) {
    return `${average.toFixed(1)} out of 5 (${count.toLocaleString()} ratings)`;
  }
  return bySource
    .map((s) => `${s.label}: ★ ${s.average.toFixed(1)} (${s.count.toLocaleString()})`)
    .join(", ");
}

export interface UnifiedRatingProps {
  average: number;
  count: number;
  /** Per-source breakdown for the tooltip — omitted or empty falls back to a bare "X out of 5 (Y ratings)" tooltip with no source name. */
  bySource?: SourceRating[];
  /** "normal" (stars + figure, the fiche layout) or "short" (stars only, for cramped card rows). */
  mode?: "normal" | "short";
  tooltipPosition?: TooltipPosition;
}

/**
 * The star-rating widget shown on an app's fiche (`/app/[id]`) and, in its
 * "short" mode, on listing cards — one component for both instead of the
 * fiche's old private `RatingStars` plus a separate always-visible
 * "Ratings by source" table row: the per-source breakdown now lives in
 * this component's own tooltip instead, so it's available in both places
 * without duplicating the same numbers twice on the fiche. Hovering
 * reveals it: the native `title` on the outer wrapper is the reliable
 * mechanism (survives a clipping ancestor), the `.tooltip`/`data-tip` on
 * the same element is the fast, no-hover-delay one for contexts with room
 * for it — same two-tier discipline as `SourceMap`/`ChannelIndicator`, no
 * separate info icon needed for either.
 */
export const UnifiedRating = component$<UnifiedRatingProps>(
  ({ average, count, bySource = [], mode = "normal", tooltipPosition = "top" }) => {
    const rounded = Math.round(average * 2) / 2;
    const tip = starsTitle(average, count, bySource);

    return (
      <span
        class={`tooltip ${TOOLTIP_POSITION_CLASSES[tooltipPosition]} before:whitespace-pre-wrap before:text-left inline-flex items-center gap-1.5`}
        title={tip}
        data-tip={tip}
      >
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
      </span>
    );
  },
);

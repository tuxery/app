import { component$ } from "@qwik.dev/core";
import type { SourceRating } from "~/catalog-types";
import { HoverTip, type TipPlacement } from "~/components/hover-tip/hover-tip";

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
    .join("\n");
}

export interface UnifiedRatingProps {
  average: number;
  count: number;
  /** Per-source breakdown for the tooltip — omitted or empty falls back to a bare "X out of 5 (Y ratings)" tooltip with no source name. */
  bySource?: SourceRating[];
  /** "normal" (stars + figure, the fiche layout) or "short" (stars only, for cramped card rows). */
  mode?: "normal" | "short";
  placement?: TipPlacement;
  /** On the product page, where it isn't inside a link: takes keyboard focus for its tooltip. */
  focusable?: boolean;
}

/**
 * The star-rating widget shown on an app's fiche (`/app/[id]`) and, in its
 * "short" mode, on listing cards — one component for both instead of the
 * fiche's old private `RatingStars` plus a separate always-visible
 * "Ratings by source" table row: the per-source breakdown now lives in
 * this component's own tooltip instead, so it's available in both places
 * without duplicating the same numbers twice on the fiche. Hovering (or,
 * on the fiche, focusing) reveals it in a `HoverTip`, which no card or
 * row clips — the same tooltip as `PlatformStack`/`BuildCount`, no
 * separate info icon needed.
 */
export const UnifiedRating = component$<UnifiedRatingProps>(
  ({ average, count, bySource = [], mode = "normal", placement = "top", focusable = false }) => {
    const rounded = Math.round(average * 2) / 2;
    const tip = starsTitle(average, count, bySource);

    return (
      <HoverTip text={tip} placement={placement} focusable={focusable}>
        <span class="inline-flex items-center gap-1.5">
          <span class="rating rating-xs rating-half" aria-hidden="true">
            {STAR_HALVES.map((position, i) => (
              <span
                key={position}
                class={[
                  // Full opacity: daisyUI's `rating` dims every child to 20%
                  // unless it's a checked radio input, which these aren't.
                  "mask mask-star-2 opacity-100!",
                  i % 2 === 0 ? "mask-half-1" : "mask-half-2",
                  // Product page: a fixed amber, not the theme's warning color
                  // (nord's is a pale yellow that barely shows against its
                  // light background). Cards: the primary color, like the
                  // platform stack's logos — amber on every card drew the eye
                  // away from the apps themselves.
                  position > rounded
                    ? "bg-base-content/20"
                    : mode === "short"
                      ? "bg-primary"
                      : "bg-amber-500",
                ]}
              />
            ))}
          </span>
          {mode === "normal" && (
            <span class="text-sm text-base-content/70">
              {average.toFixed(1)} ({count.toLocaleString()})
            </span>
          )}
        </span>
      </HoverTip>
    );
  },
);

import { component$ } from "@builder.io/qwik";
import { ALL_SOURCE_GROUPS, SOURCE_GROUP_MEMBERS, type PackageSourceId } from "~/catalog-types";
import { tooltipClass, type TooltipPosition } from "~/components/tooltip-position";

export interface SourceMapProps {
  sources: PackageSourceId[];
  tooltipPosition?: TooltipPosition;
}

/**
 * A source dot-map — one small square per platform/distro group, colored
 * when this app has a package there — used on both listing cards
 * (`AppCard`) and the app-detail page's hero/sticky header. Hovering
 * reveals which ones: the native `title` is the reliable mechanism (works
 * from inside a horizontal-scroll row's `overflow-x-auto`, or a sticky
 * header's `overflow: hidden` — both clip a CSS tooltip's popup entirely);
 * the `.tooltip`/`data-tip` on the same element is the fast, no-hover-
 * delay one for contexts with room for it.
 *
 * Was half of `SourceSummary` (paired with `ChannelIndicator`, its other
 * half) — the combined dot-map + package-count badge + one shared info
 * icon was too wide for many listing cards, wrapping to two lines on some
 * and not others depending on content. Two narrower, single-purpose
 * pieces (each carrying its own tooltip directly, no separate icon
 * needed) fit a card's bottom row on one line instead.
 */
export const SourceMap = component$<SourceMapProps>(({ sources, tooltipPosition = "top" }) => {
  const sourceSet = new Set(sources);
  const presentGroups = ALL_SOURCE_GROUPS.filter((group) =>
    SOURCE_GROUP_MEMBERS[group]?.some((source) => sourceSet.has(source)),
  );
  const tip = presentGroups.length ? presentGroups.join(", ") : "No sources";

  return (
    <div
      class={tooltipClass(tooltipPosition, "grid grid-rows-2 grid-flow-col gap-0.5")}
      title={tip}
      data-tip={tip}
    >
      {ALL_SOURCE_GROUPS.map((group) => (
        <span
          key={group}
          class={`w-1.5 h-1.5 rounded-[1px] ${presentGroups.includes(group) ? "bg-primary" : "bg-base-300"}`}
        />
      ))}
    </div>
  );
});

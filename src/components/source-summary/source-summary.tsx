import { component$ } from "@builder.io/qwik";
import { LuInfo, LuPackage } from "@qwikest/icons/lucide";
import { ALL_SOURCE_GROUPS, SOURCE_GROUP_MEMBERS, type PackageSourceId } from "~/catalog-types";

// Full literal class names, not a template-interpolated `tooltip-${...}` —
// Tailwind's static scanner needs each one spelled out verbatim in the
// source to generate its CSS at all.
const TOOLTIP_POSITION_CLASSES = {
  top: "tooltip-top",
  bottom: "tooltip-bottom",
  right: "tooltip-right",
} as const;

export interface SourceSummaryProps {
  sources: PackageSourceId[];
  packageCount: number;
  channels: string[];
  /** Which side the CSS tooltip opens toward — pick whichever has room in the surrounding layout (e.g. "top" for a card near the bottom of its row, "bottom" for a heading near the top of the page). Purely cosmetic: the native `title` fallback below is what actually survives a clipping ancestor. */
  tooltipPosition?: "top" | "bottom" | "right";
}

/**
 * A source dot-map (one small square per platform/distro group, colored
 * when this app has a package there) + a package-count badge + an info
 * icon whose tooltip names the actual source groups and build channels —
 * the shared "how many ways can I install this, and which" summary used
 * on both listing cards (`AppCard`) and the app-detail page's hero/sticky
 * header. Was `AppInstallSummary`, app-detail-only; renamed once it moved
 * here since there's no "Install" button next to it on a card.
 *
 * Two tooltip mechanisms stacked on purpose, not redundant: the native
 * `title` on the outer wrapper is the reliable one (works from inside a
 * horizontal-scroll row's `overflow-x-auto`, or a sticky header's
 * `overflow: hidden` — both clip the CSS tooltip's popup entirely); the
 * inner `.tooltip`/`data-tip` is the fast, no-hover-delay one for
 * contexts with room for it.
 */
export const SourceSummary = component$<SourceSummaryProps>(
  ({ sources, packageCount, channels, tooltipPosition = "top" }) => {
    const sourceSet = new Set(sources);
    const presentGroups = ALL_SOURCE_GROUPS.filter((group) =>
      SOURCE_GROUP_MEMBERS[group]?.some((source) => sourceSet.has(source)),
    );
    const sourcesTip = presentGroups.length ? presentGroups.join(", ") : "none";
    const channelsTip = channels.join(", ");
    const tip = `sources: ${sourcesTip}\nchannels: ${channelsTip}`;

    return (
      <div class="flex items-center gap-2" title={tip}>
        <div class="grid grid-rows-2 grid-flow-col gap-0.5" aria-hidden="true">
          {ALL_SOURCE_GROUPS.map((group) => (
            <span
              key={group}
              class={`w-1.5 h-1.5 rounded-[1px] ${presentGroups.includes(group) ? "bg-primary" : "bg-base-300"}`}
            />
          ))}
        </div>
        <div class="indicator" aria-hidden="true">
          <span
            class="indicator-item indicator-top indicator-end badge badge-xs text-[10px]"
            style="padding: 0 1px"
          >
            {packageCount}
          </span>
          <LuPackage class="text-sm text-base-content/50" />
        </div>
        <div
          class={`tooltip ${TOOLTIP_POSITION_CLASSES[tooltipPosition]} before:whitespace-pre-wrap before:text-left`}
          data-tip={tip}
        >
          <LuInfo class="text-sm text-base-content/50 cursor-help" />
        </div>
      </div>
    );
  },
);

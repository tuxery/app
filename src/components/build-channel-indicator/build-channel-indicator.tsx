import { component$ } from "@builder.io/qwik";
import { LuLayers } from "@qwikest/icons/lucide";
import { tooltipClass, type TooltipPosition } from "~/components/tooltip-position";

export interface BuildChannelIndicatorProps {
  channels: string[];
  tooltipPosition?: TooltipPosition;
}

/**
 * How many distinct build channels/variants this app has (e.g. AUR's
 * official/-git/-bin builds) — badge is `channels.length`, hovering
 * (native `title`, plus a fast CSS tooltip) names them. Deliberately not a
 * raw package count: an app can carry a dozen packages (one per distro)
 * that are all the same "Stable" channel, which belongs on `SourceMap`'s
 * dot-map, not here — real bug, found live: an earlier version badged the
 * *package* count instead (e.g. 27) right next to a tooltip naming only 2
 * channels, which read as broken. Renamed from `ChannelIndicator` once
 * that confusion was traced back to the badge itself, not just the
 * tooltip. A stack-of-layers icon reads as "multiple versions of the same
 * thing" without needing dev vocabulary — tried a git-branch glyph first,
 * but that reads as version-control jargon to non-developers; a tag icon
 * was also considered but sits too close visually to this app's own
 * category badges (Game, Simulation, ...) just above it on the page. Was
 * half of `SourceSummary` (paired with `SourceMap`, its other half) — see
 * that component's doc comment for why they split.
 */
export const BuildChannelIndicator = component$<BuildChannelIndicatorProps>(
  ({ channels, tooltipPosition = "top" }) => {
    const tip = channels.join(", ");

    return (
      <div class={tooltipClass(tooltipPosition, "indicator")} title={tip} data-tip={tip}>
        <span
          class="indicator-item indicator-top indicator-end badge badge-xs text-[10px]"
          style="padding: 0 1px"
        >
          {channels.length}
        </span>
        <LuLayers class="text-sm text-base-content/50" />
      </div>
    );
  },
);

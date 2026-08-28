import { component$ } from "@builder.io/qwik";
import { LuPackage } from "@qwikest/icons/lucide";
import { tooltipClass, type TooltipPosition } from "~/components/tooltip-position";

export interface ChannelIndicatorProps {
  packageCount: number;
  channels: string[];
  tooltipPosition?: TooltipPosition;
}

/**
 * The package-count badge — how many installable packages this app has
 * across every source, hovering (native `title`, plus a fast CSS tooltip)
 * names the build channels behind that count (e.g. AUR's stable/-git/-bin
 * builds). Was half of `SourceSummary` (paired with `SourceMap`, its other
 * half) — see that component's doc comment for why they split.
 */
export const ChannelIndicator = component$<ChannelIndicatorProps>(
  ({ packageCount, channels, tooltipPosition = "top" }) => {
    const tip = channels.join(", ");

    return (
      <div class={tooltipClass(tooltipPosition, "indicator")} title={tip} data-tip={tip}>
        <span
          class="indicator-item indicator-top indicator-end badge badge-xs text-[10px]"
          style="padding: 0 1px"
        >
          {packageCount}
        </span>
        <LuPackage class="text-sm text-base-content/50" />
      </div>
    );
  },
);

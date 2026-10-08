import { component$ } from "@qwik.dev/core";
import { LuLayers } from "@qwikest/icons/lucide";
import { tooltipClass, type TooltipPosition } from "~/components/tooltip-position";

export interface BuildIndicatorProps {
  builds: string[];
  tooltipPosition?: TooltipPosition;
}

/**
 * How many distinct builds this app has (its tracks, risks and flavors:
 * Firefox's ESR, Nightly, AUR `-bin`/`-git` builds, ... — see catalog's
 * docs/product-families.md) — badge is `builds.length`, hovering
 * (native `title`, plus a fast CSS tooltip) names them. Deliberately not a
 * raw package count: an app can carry a dozen packages (one per distro)
 * that are all the same "Stable" build, which belongs on `SourceMap`'s
 * dot-map, not here — real bug, found live: an earlier version badged the
 * *package* count instead (e.g. 27) right next to a tooltip naming only 2
 * builds, which read as broken. Was `ChannelIndicator`, then
 * `BuildChannelIndicator`, before "channel" was split into track/risk/
 * flavors. A stack-of-layers icon reads as "multiple versions of the same
 * thing" without needing dev vocabulary — tried a git-branch glyph first,
 * but that reads as version-control jargon to non-developers; a tag icon
 * was also considered but sits too close visually to this app's own
 * category badges (Game, Simulation, ...) just above it on the page. Was
 * half of `SourceSummary` (paired with `SourceMap`, its other half) — see
 * that component's doc comment for why they split.
 */
export const BuildIndicator = component$<BuildIndicatorProps>(
  ({ builds, tooltipPosition = "top" }) => {
    const tip = builds.join(", ");

    return (
      <div class={tooltipClass(tooltipPosition, "indicator")} title={tip} data-tip={tip}>
        <span
          class="indicator-item indicator-top indicator-end badge badge-xs text-[10px]"
          style="padding: 0 1px"
        >
          {builds.length}
        </span>
        <LuLayers class="text-sm text-base-content/50" />
      </div>
    );
  },
);

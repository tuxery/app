import { component$ } from "@qwik.dev/core";
import { LuBoxes, LuFlaskConical, LuSplit } from "@qwikest/icons/lucide";
import type { ReleaseLines } from "~/catalog-types";
import { HoverTip, type TipPlacement } from "~/components/hover-tip/hover-tip";

export interface BuildIndicatorProps {
  lines: ReleaseLines;
  placement?: TipPlacement;
  /** On the product page, where it isn't inside a link: takes keyboard focus for its tooltip. */
  focusable?: boolean;
}

type Axis = "editions" | "versions" | "builds";

/**
 * Which counts to show, at most two: editions and versions when the app
 * has more than one of either, otherwise its other builds (counting the
 * default one). Empty for an app with a single build.
 */
export function releaseLineCounts(lines: ReleaseLines): { axis: Axis; count: number }[] {
  const counts: { axis: Axis; count: number }[] = [];
  if (lines.editions.length > 1) counts.push({ axis: "editions", count: lines.editions.length });
  if (lines.versions.length > 1) counts.push({ axis: "versions", count: lines.versions.length });
  if (counts.length === 0 && lines.otherBuilds.length > 0) {
    counts.push({ axis: "builds", count: lines.otherBuilds.length + 1 });
  }
  return counts;
}

function releaseLinesTip(lines: ReleaseLines): string {
  return [
    lines.editions.length > 1 && `Editions: ${lines.editions.join(", ")}`,
    lines.versions.length > 1 && `Versions: ${lines.versions.join(", ")}`,
    lines.otherBuilds.length > 0 && `Other builds: ${lines.otherBuilds.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * The editions and versions an app comes in, as one or two small icons
 * with a count each — compact enough to share an app card's bottom row
 * with the source stack and the rating:
 *   - parallel lines splitting: editions (Firefox ESR, Developer Edition)
 *   - a lab flask: versions (Beta, Nightly — pre-releases)
 *   - boxes, only when neither applies: other builds (`bin`, AppImage...)
 * Nothing for an app with a single build (about 75% of the catalog).
 * Names in a tooltip no card or row clips (`HoverTip`).
 */
export const BuildIndicator = component$<BuildIndicatorProps>(
  ({ lines, placement = "top", focusable = false }) => {
    const counts = releaseLineCounts(lines);
    if (counts.length === 0) return null;
    return (
      <HoverTip text={releaseLinesTip(lines)} placement={placement} focusable={focusable}>
        <span class="inline-flex items-center gap-2">
          {counts.map(({ axis, count }) => (
            <span key={axis} class="indicator">
              <span class="sr-only">
                {count} {axis}
              </span>
              <span
                aria-hidden="true"
                class="indicator-item indicator-top indicator-end badge badge-xs text-[10px]"
                style="padding: 0 1px"
              >
                {count}
              </span>
              {axis === "editions" && <LuSplit class="text-sm text-base-content/70" />}
              {axis === "versions" && <LuFlaskConical class="text-sm text-base-content/70" />}
              {axis === "builds" && <LuBoxes class="text-sm text-base-content/70" />}
            </span>
          ))}
        </span>
      </HoverTip>
    );
  },
);

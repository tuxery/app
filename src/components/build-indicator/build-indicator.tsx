import { component$ } from "@qwik.dev/core";
import { LuLayers } from "@qwikest/icons/lucide";
import type { ReleaseLines } from "~/catalog-types";
import { HoverTip, type TipPlacement } from "~/components/hover-tip/hover-tip";

export interface BuildIndicatorProps {
  lines: ReleaseLines;
  placement?: TipPlacement;
  /** On the product page, where it isn't inside a link: takes keyboard focus for its tooltip. */
  focusable?: boolean;
}

/**
 * How many builds an app comes in: every edition's versions, plus its
 * other builds (`bin`, AppImage...). 1 for an app with a single build.
 */
export function buildCount(lines: ReleaseLines): number {
  const editionBuilds = lines.editions.reduce((sum, edition) => sum + edition.versions.length, 0);
  return Math.max(1, editionBuilds) + lines.otherBuilds.length;
}

/** One line per edition, "ESR: Stable, Beta", then the other builds. */
export function releaseLinesTip(lines: ReleaseLines): string {
  return [
    ...lines.editions.map((edition) => `${edition.name}: ${edition.versions.join(", ")}`),
    lines.otherBuilds.length > 0 && `Other builds: ${lines.otherBuilds.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * How many builds an app comes in, as one small layers icon with a count
 * badge — compact enough to share an app card's bottom row with the
 * source stack and the rating. The tooltip spells the combinations out,
 * one edition per line ("Standard: Stable, Beta, Nightly" / "ESR:
 * Stable"), then the other builds. Nothing for an app with a single build
 * (about 75% of the catalog). `HoverTip`: no card or row clips it.
 */
export const BuildIndicator = component$<BuildIndicatorProps>(
  ({ lines, placement = "top", focusable = false }) => {
    const count = buildCount(lines);
    if (count <= 1) return null;
    return (
      <HoverTip text={releaseLinesTip(lines)} placement={placement} focusable={focusable}>
        <span class="indicator">
          <span class="sr-only">{count} builds</span>
          <span
            aria-hidden="true"
            class="indicator-item indicator-top indicator-end badge badge-xs text-[10px]"
            style="padding: 0 1px"
          >
            {count}
          </span>
          <LuLayers class="text-sm text-base-content/70" />
        </span>
      </HoverTip>
    );
  },
);

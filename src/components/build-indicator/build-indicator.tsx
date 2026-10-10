import { component$ } from "@qwik.dev/core";
import type { ReleaseLines } from "~/catalog-types";
import { HoverTip, type TipPlacement } from "~/components/hover-tip/hover-tip";

export interface BuildIndicatorProps {
  lines: ReleaseLines;
  placement?: TipPlacement;
  /** On the product page, where it isn't inside a link: takes keyboard focus for its tooltip. */
  focusable?: boolean;
}

/** "3 editions · 4 versions", "2 versions", "5 builds" — `undefined` when the app has a single build. */
export function releaseLinesLabel(lines: ReleaseLines): string | undefined {
  const parts = [
    lines.editions.length > 1 && `${lines.editions.length} editions`,
    lines.versions.length > 1 && `${lines.versions.length} versions`,
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(" · ");
  return lines.otherBuilds.length > 0 ? `${lines.otherBuilds.length + 1} builds` : undefined;
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
 * The editions and versions an app comes in (and its other builds), in
 * words — the product page's Edition/Version vocabulary, see the glossary.
 * Replaces a stack-of-layers icon with a count badge, which predated
 * editions and versions and said "1" on most apps: an app with a single
 * build now shows nothing. Details in a tooltip that no card or row
 * clips (`HoverTip`).
 */
export const BuildIndicator = component$<BuildIndicatorProps>(
  ({ lines, placement = "top", focusable = false }) => {
    const label = releaseLinesLabel(lines);
    if (!label) return null;
    return (
      <HoverTip text={releaseLinesTip(lines)} placement={placement} focusable={focusable}>
        <span class="text-xs text-base-content/70 whitespace-nowrap">{label}</span>
      </HoverTip>
    );
  },
);

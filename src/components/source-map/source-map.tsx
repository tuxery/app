import { component$ } from "@builder.io/qwik";
import { ALL_SOURCE_GROUPS, SOURCE_GROUP_MEMBERS, type PackageSourceId } from "~/catalog-types";
import { tooltipClass, type TooltipPosition } from "~/components/tooltip-position";
import { findOsEntry, recommendedGroupIds } from "~/os-catalog";
import { useSettings } from "~/settings";

// Sources with a real developer-identity-verification signal today — only
// Flathub. Deliberately not "every source without a verified package is
// unverified": a distro's own repo (Debian, Fedora, ...) has no such
// concept to check at all, so its dot stays the single plain "present"
// color it always has — only a group that actually *has* a verifiable
// member (Flatpak, via Flathub) gets the multi-tone treatment below.
const VERIFIABLE_SOURCES = new Set<PackageSourceId>(["flatpak-flathub"]);

export interface SourceMapProps {
  sources: PackageSourceId[];
  /** Which of `sources` carries a verified package — see `VERIFIABLE_SOURCES`. */
  verifiedSources?: PackageSourceId[];
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
 * Was half of `SourceSummary` (paired with `BuildChannelIndicator`, its other
 * half) — the combined dot-map + package-count badge + one shared info
 * icon was too wide for many listing cards, wrapping to two lines on some
 * and not others depending on content. Two narrower, single-purpose
 * pieces (each carrying its own tooltip directly, no separate icon
 * needed) fit a card's bottom row on one line instead.
 *
 * A verifiable group's dot carries four tiers instead of the plain
 * present/absent two every other group has — muted daisyUI semantic
 * tones throughout (never a saturated/attention-grabbing color; this is
 * informative, not a callout, same restraint as `BuildChannelIndicator`),
 * automatically theme-correct in light/dark since none are hardcoded:
 *   - verified AND the selected OS recommends it: soft green
 *   - verified, but not recommended for the selected OS (or none picked): soft blue
 *   - present but not verified: today's dim primary
 *   - absent: gray, unchanged
 * Reads the OS selection itself via `useSettings` (same "read the live
 * signal directly" pattern as `SourceTabBar`/`GroupShownControl`) rather
 * than threading it through every caller — this renders on every listing
 * card sitewide, not just the detail page (which also shows its own
 * explicit "Verified developer" badge — see that page's hero).
 */
export const SourceMap = component$<SourceMapProps>(
  ({ sources, verifiedSources = [], tooltipPosition = "top" }) => {
    const settings = useSettings();
    const osEntry = findOsEntry(settings.osId.value);
    const recommended = osEntry ? recommendedGroupIds(osEntry) : undefined;

    const sourceSet = new Set(sources);
    const verifiedSet = new Set(verifiedSources);
    const presentGroups = ALL_SOURCE_GROUPS.filter((group) =>
      SOURCE_GROUP_MEMBERS[group]?.some((source) => sourceSet.has(source)),
    );

    const isVerifiable = (group: string) =>
      SOURCE_GROUP_MEMBERS[group]?.some((source) => VERIFIABLE_SOURCES.has(source)) ?? false;
    const isVerified = (group: string) =>
      SOURCE_GROUP_MEMBERS[group]?.some((source) => verifiedSet.has(source)) ?? false;

    const dotClass = (group: string): string => {
      if (!presentGroups.includes(group)) return "bg-base-300";
      if (!isVerified(group)) return isVerifiable(group) ? "bg-primary/50" : "bg-primary";
      return recommended?.has(group) ? "bg-success/70" : "bg-info/70";
    };

    const tip = presentGroups.length
      ? presentGroups
          .map((group) => {
            if (!isVerified(group)) return group;
            return recommended?.has(group)
              ? `${group} ✓ verified, recommended for your OS`
              : `${group} ✓ verified`;
          })
          .join(", ")
      : "No sources";

    return (
      <div
        class={tooltipClass(tooltipPosition, "grid grid-rows-2 grid-flow-col gap-0.5")}
        title={tip}
        data-tip={tip}
      >
        {ALL_SOURCE_GROUPS.map((group) => (
          <span key={group} class={`w-1.5 h-1.5 rounded-[1px] ${dotClass(group)}`} />
        ))}
      </div>
    );
  },
);

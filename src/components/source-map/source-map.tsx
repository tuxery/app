import { component$ } from "@builder.io/qwik";
import { ALL_SOURCE_GROUPS, SOURCE_GROUP_MEMBERS, type PackageSourceId } from "~/catalog-types";
import { tooltipClass, type TooltipPosition } from "~/components/tooltip-position";

// Sources with a real developer-identity-verification signal today — only
// Flathub. Deliberately not "every source without a verified package is
// unverified": a distro's own repo (Debian, Fedora, ...) has no such
// concept to check at all, so its dot stays the single plain "present"
// color it always has — only a group that actually *has* a verifiable
// member (Flatpak, via Flathub) gets the two-tone treatment below.
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
 * A verifiable group's dot dims to half-opacity when present but not
 * verified — subtle by design, this renders on every listing card
 * sitewide, not just the detail page (which shows its own explicit
 * "Verified developer" badge instead — see that page's hero).
 */
export const SourceMap = component$<SourceMapProps>(
  ({ sources, verifiedSources = [], tooltipPosition = "top" }) => {
    const sourceSet = new Set(sources);
    const verifiedSet = new Set(verifiedSources);
    const presentGroups = ALL_SOURCE_GROUPS.filter((group) =>
      SOURCE_GROUP_MEMBERS[group]?.some((source) => sourceSet.has(source)),
    );

    const isVerifiable = (group: string) =>
      SOURCE_GROUP_MEMBERS[group]?.some((source) => VERIFIABLE_SOURCES.has(source)) ?? false;
    const isVerified = (group: string) =>
      SOURCE_GROUP_MEMBERS[group]?.some((source) => verifiedSet.has(source)) ?? false;

    const tip = presentGroups.length
      ? presentGroups.map((group) => (isVerified(group) ? `${group} ✓ verified` : group)).join(", ")
      : "No sources";

    return (
      <div
        class={tooltipClass(tooltipPosition, "grid grid-rows-2 grid-flow-col gap-0.5")}
        title={tip}
        data-tip={tip}
      >
        {ALL_SOURCE_GROUPS.map((group) => {
          const present = presentGroups.includes(group);
          const dimVerifiable = present && isVerifiable(group) && !isVerified(group);
          return (
            <span
              key={group}
              class={`w-1.5 h-1.5 rounded-[1px] ${
                !present ? "bg-base-300" : dimVerifiable ? "bg-primary/50" : "bg-primary"
              }`}
            />
          );
        })}
      </div>
    );
  },
);

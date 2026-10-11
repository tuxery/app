import { component$ } from "@qwik.dev/core";
import { ALL_SOURCE_GROUPS, SOURCE_GROUP_MEMBERS, type PackageSourceId } from "~/catalog-types";
import { HoverTip, type TipPlacement } from "~/components/hover-tip/hover-tip";
import { Logo } from "~/components/logo/logo";
import { INSTALL_GROUP_LOGOS } from "~/data/logos";
import { findOsEntry, recommendedGroupIds } from "~/os-catalog";
import { useSettings } from "~/settings";

/** How many platform logos show before the "+N" chip. */
const SHOWN = 3;

export interface SourceStackProps {
  sources: PackageSourceId[];
  /** Which of `sources` carries a verified package (Flathub today). */
  verifiedSources?: PackageSourceId[];
  placement?: TipPlacement;
  /** On the product page, where it isn't inside a link: takes keyboard focus for its tooltip. */
  focusable?: boolean;
}

/**
 * The way to install an app this page recommends, among the platform
 * groups it's on: the selected OS's own packages (its package manager,
 * nothing to set up), else Flatpak (works on every distribution), else
 * the first group the OS uses, else the first one listed.
 */
export function recommendedGroup(
  present: string[],
  osGroup: string | undefined,
  usedByOs: Set<string> | undefined,
): string | undefined {
  if (osGroup && present.includes(osGroup)) return osGroup;
  if (present.includes("Flatpak")) return "Flatpak";
  return present.find((group) => usedByOs?.has(group)) ?? present[0];
}

/**
 * Where an app can be installed, as a stack of overlapping platform logos
 * (Flatpak, Snap, the distributions...) on listing cards and the product
 * page: the recommended way first (`recommendedGroup`), then what the
 * selected OS uses — its logos in the primary color — then the rest. Three
 * logos at most; beyond that a count badge, the same as `BuildIndicator`'s,
 * gives the total. Every platform, one per line, in the tooltip.
 *
 * Replaces the source dot-map (one tiny square per platform group, 21 of
 * them), which nobody could read without hovering.
 */
export const SourceStack = component$<SourceStackProps>(
  ({ sources, verifiedSources = [], placement = "top", focusable = false }) => {
    const settings = useSettings();
    const osEntry = findOsEntry(settings.osId.value);
    const usedByOs = osEntry ? recommendedGroupIds(osEntry) : undefined;

    const sourceSet = new Set(sources);
    const verifiedSet = new Set(verifiedSources);
    const present = ALL_SOURCE_GROUPS.filter((group) =>
      SOURCE_GROUP_MEMBERS[group]?.some((source) => sourceSet.has(source)),
    );
    const first = recommendedGroup(present, osEntry?.distroGroupId, usedByOs);
    if (!first) return null;
    const rest = present.filter((group) => group !== first);
    const ordered = [
      first,
      ...rest.filter((group) => usedByOs?.has(group)),
      ...rest.filter((group) => !usedByOs?.has(group)),
    ];
    const isVerified = (group: string) =>
      SOURCE_GROUP_MEMBERS[group]?.some((source) => verifiedSet.has(source)) ?? false;

    const tip = ordered
      .map((group) => {
        const notes = [
          group === first && "recommended",
          isVerified(group) && "✓ verified",
          usedByOs?.has(group) && "used on your OS",
        ].filter(Boolean);
        return notes.length > 0 ? `${group} (${notes.join(", ")})` : group;
      })
      .join("\n");

    return (
      <HoverTip text={tip} placement={placement} focusable={focusable}>
        <span class={["inline-flex", ordered.length > SHOWN && "indicator"]}>
          {ordered.length > SHOWN && (
            <>
              <span class="sr-only">{ordered.length} platforms</span>
              <span
                aria-hidden="true"
                class="indicator-item indicator-top indicator-end badge badge-xs text-[10px]"
                style="padding: 0 1px"
              >
                {ordered.length}
              </span>
            </>
          )}
          <span class="flex -space-x-2">
            {ordered.slice(0, SHOWN).map((group) => (
              <span
                key={group}
                class="w-5.5 h-5.5 rounded-full bg-base-100 flex items-center justify-center border border-base-300"
              >
                <Logo
                  slug={INSTALL_GROUP_LOGOS[group]}
                  class={[
                    "w-3.5 h-3.5",
                    // With an OS picked, the platforms it doesn't use fade
                    // further, so its own (primary) stand out in both themes.
                    usedByOs?.has(group)
                      ? "text-primary"
                      : usedByOs
                        ? "text-base-content/45"
                        : "text-base-content/70",
                  ].join(" ")}
                />
              </span>
            ))}
          </span>
        </span>
      </HoverTip>
    );
  },
);

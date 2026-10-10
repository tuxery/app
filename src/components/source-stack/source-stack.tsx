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
 * Where an app can be installed, as a stack of overlapping platform logos
 * (Flatpak, Snap, the distributions...) — the first three, then "+N" — on
 * listing cards and the product page. Platforms the selected OS uses come
 * first, so on Fedora a card leads with what works there; a verified
 * package (Flathub's verified developers) rings its logo. Every platform,
 * one per line, in the tooltip.
 *
 * Replaces the source dot-map (one tiny square per platform group, 21 of
 * them), which nobody could read without hovering.
 */
export const SourceStack = component$<SourceStackProps>(
  ({ sources, verifiedSources = [], placement = "top", focusable = false }) => {
    const settings = useSettings();
    const osEntry = findOsEntry(settings.osId.value);
    const recommended = osEntry ? recommendedGroupIds(osEntry) : undefined;

    const sourceSet = new Set(sources);
    const verifiedSet = new Set(verifiedSources);
    const present = ALL_SOURCE_GROUPS.filter((group) =>
      SOURCE_GROUP_MEMBERS[group]?.some((source) => sourceSet.has(source)),
    );
    const ordered = recommended
      ? [
          ...present.filter((g) => recommended.has(g)),
          ...present.filter((g) => !recommended.has(g)),
        ]
      : present;
    const isVerified = (group: string) =>
      SOURCE_GROUP_MEMBERS[group]?.some((source) => verifiedSet.has(source)) ?? false;

    if (ordered.length === 0) return null;

    const tip = ordered
      .map((group) => {
        const notes = [
          isVerified(group) && "✓ verified",
          recommended?.has(group) && "used on your OS",
        ].filter(Boolean);
        return notes.length > 0 ? `${group} (${notes.join(", ")})` : group;
      })
      .join("\n");
    const hidden = ordered.length - SHOWN;

    return (
      <HoverTip text={tip} placement={placement} focusable={focusable}>
        <span class="inline-flex items-center">
          <span class="flex -space-x-2">
            {ordered.slice(0, SHOWN).map((group) => (
              <span
                key={group}
                class={[
                  "w-5.5 h-5.5 rounded-full bg-base-100 flex items-center justify-center border",
                  isVerified(group) ? "border-primary ring-1 ring-primary" : "border-base-300",
                ]}
              >
                <Logo slug={INSTALL_GROUP_LOGOS[group]} class="w-3.5 h-3.5 text-base-content/80" />
              </span>
            ))}
          </span>
          {hidden > 0 && (
            <span class="ml-1 text-[11px] font-medium text-base-content/70">+{hidden}</span>
          )}
        </span>
      </HoverTip>
    );
  },
);

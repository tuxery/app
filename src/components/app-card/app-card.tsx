import { component$ } from "@builder.io/qwik";
import { LuPackage } from "@qwikest/icons/lucide";
import { ALL_SOURCE_GROUPS, SOURCE_GROUP_MEMBERS, type PackageSourceId } from "~/catalog-types";

export interface AppCardProps {
  iconUrl?: string;
  name: string;
  description: string;
  sources: PackageSourceId[];
  contentType?: "game";
  category?: string;
  rating?: { average: number; count: number };
}

/**
 * A source dot-map: one small square per platform/distro group
 * (`ALL_SOURCE_GROUPS` — Flatpak regardless of remote, Ubuntu regardless of
 * component, one per distro, not one per raw packaging backend), always at
 * the same grid position across every card, colored when this app has a
 * source in that group and grayed out otherwise — 2 rows, as many columns
 * as `ALL_SOURCE_GROUPS` needs. A native `title` (not daisyUI's CSS
 * tooltip) over the whole grid rather than per-square, listing the groups
 * this app actually has — a CSS tooltip's popup gets clipped by the
 * horizontal-scroll card row it lives in (an `overflow-x-auto` ancestor
 * clips any absolutely-positioned popup that would escape it, not just the
 * scroll axis), so the browser's own tooltip is the reliable option here.
 */
const SourceDotMap = component$<{ sources: PackageSourceId[] }>(({ sources }) => {
  const sourceSet = new Set(sources);
  const presentGroups = ALL_SOURCE_GROUPS.filter((group) =>
    SOURCE_GROUP_MEMBERS[group]?.some((source) => sourceSet.has(source)),
  );
  const tip = presentGroups.length ? presentGroups.join(", ") : "No sources available";

  return (
    <div title={tip} aria-label={tip}>
      <div class="grid grid-rows-2 grid-flow-col gap-0.5" aria-hidden="true">
        {ALL_SOURCE_GROUPS.map((group) => (
          <span
            key={group}
            class={`w-1.5 h-1.5 rounded-[1px] ${presentGroups.includes(group) ? "bg-primary" : "bg-base-300"}`}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * One unified card per app — the core Tuxery UX rule (init.md): even when
 * an app ships as Flatpak, Snap, *and* AppImage, it renders as exactly one
 * card here, with a badge per available source.
 *
 * Layout: logo + name/category-or-rating on top, description below, and a
 * bottom row (source dot-map + tags) pinned to the card's bottom edge via
 * `mt-auto` so it lines up across cards regardless of description length.
 */
export const AppCard = component$<AppCardProps>(
  ({ iconUrl, name, description, sources, contentType, category, rating }) => {
    return (
      <article class="glass-card card h-full transition-shadow hover:shadow-lg">
        <div class="card-body gap-2 p-5">
          <div class="flex items-center gap-3">
            <div class="w-14 h-14 rounded-field bg-base-200 flex items-center justify-center overflow-hidden shrink-0">
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt=""
                  width={56}
                  height={56}
                  class="w-full h-full object-cover"
                />
              ) : (
                <LuPackage class="text-2xl text-base-content/40" />
              )}
            </div>
            <div class="min-w-0">
              <h3 class="card-title text-base line-clamp-1">{name}</h3>
              {category ? (
                <p class="text-sm text-base-content/60 line-clamp-1">{category}</p>
              ) : (
                rating && (
                  <p class="text-sm text-base-content/60 line-clamp-1">
                    ★ {rating.average.toFixed(1)} ({rating.count})
                  </p>
                )
              )}
            </div>
          </div>
          <p class="text-sm text-base-content/70 line-clamp-2">{description}</p>
          <div class="flex flex-wrap items-center gap-2 mt-auto pt-1">
            <SourceDotMap sources={sources} />
            {contentType === "game" && <span class="badge badge-accent badge-sm">Game</span>}
          </div>
        </div>
      </article>
    );
  },
);

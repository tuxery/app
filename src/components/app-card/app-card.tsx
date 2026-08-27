import { component$ } from "@builder.io/qwik";
import { LuPackage } from "@qwikest/icons/lucide";
import { SourceSummary } from "~/components/source-summary/source-summary";
import type { PackageSourceId } from "~/catalog-types";

export interface AppCardProps {
  iconUrl?: string;
  name: string;
  description: string;
  sources: PackageSourceId[];
  packageCount: number;
  channels: string[];
  contentType?: "game";
  category?: string;
  rating?: { average: number; count: number };
}

/**
 * One unified card per app — the core Tuxery UX rule (init.md): even when
 * an app ships as Flatpak, Snap, *and* AppImage, it renders as exactly one
 * card here, with a badge per available source.
 *
 * Layout: logo + name/category-or-rating on top, description below, and
 * `SourceSummary` (the same dot-map + package-count + info-tooltip used on
 * the app-detail page's hero/sticky header) pinned to the card's bottom
 * edge via `mt-auto` so it lines up across cards regardless of description
 * length.
 */
export const AppCard = component$<AppCardProps>(
  ({ iconUrl, name, description, sources, packageCount, channels, category, rating }) => {
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
                <p class="text-sm text-base-content/60 line-clamp-1 break-words" title={category}>
                  {category}
                </p>
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
            <SourceSummary sources={sources} packageCount={packageCount} channels={channels} />
          </div>
        </div>
      </article>
    );
  },
);

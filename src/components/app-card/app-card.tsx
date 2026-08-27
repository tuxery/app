import { component$ } from "@builder.io/qwik";
import { LuPackage } from "@qwikest/icons/lucide";
import { ChannelIndicator } from "~/components/channel-indicator/channel-indicator";
import { SourceMap } from "~/components/source-map/source-map";
import { UnifiedRating } from "~/components/unified-rating/unified-rating";
import type { PackageSourceId, SourceRating } from "~/catalog-types";

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
  ratingsBySource?: SourceRating[];
}

/**
 * One unified card per app — the core Tuxery UX rule (init.md): even when
 * an app ships as Flatpak, Snap, *and* AppImage, it renders as exactly one
 * card here, with a badge per available source.
 *
 * Layout: logo + name/category on top, description below, and a bottom row
 * — pinned to the card's bottom edge via `mt-auto` so it lines up across
 * cards regardless of description length — `SourceMap`, `ChannelIndicator`,
 * then (when this app has one) `UnifiedRating` in its "short" (stars-only)
 * mode, left-aligned in that fixed order rather than spread with
 * `justify-between`: with that, a card carrying no rating had nothing to
 * hold `ChannelIndicator` at its own centered spot, so it drifted to the
 * row's right edge instead. Three narrow pieces instead of one wide
 * combined summary + rating: that used to wrap to two lines on some cards
 * and not others depending on content.
 */
export const AppCard = component$<AppCardProps>(
  ({
    iconUrl,
    name,
    description,
    sources,
    packageCount,
    channels,
    category,
    rating,
    ratingsBySource,
  }) => {
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
              {category && (
                <p class="text-sm text-base-content/60 line-clamp-1 break-words" title={category}>
                  {category}
                </p>
              )}
            </div>
          </div>
          <p class="text-sm text-base-content/70 line-clamp-2">{description}</p>
          <div class="flex flex-wrap items-center gap-4 mt-auto pt-1">
            <SourceMap sources={sources} />
            <ChannelIndicator packageCount={packageCount} channels={channels} />
            {rating && (
              <UnifiedRating
                average={rating.average}
                count={rating.count}
                bySource={ratingsBySource}
                mode="short"
                tooltipPosition="top"
              />
            )}
          </div>
        </div>
      </article>
    );
  },
);

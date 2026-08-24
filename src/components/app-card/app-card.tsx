import { component$ } from "@builder.io/qwik";
import { LuPackage } from "@qwikest/icons/lucide";
import { ALL_PACKAGE_SOURCE_IDS, SOURCE_LABELS, type PackageSourceId } from "~/catalog-types";

export interface AppCardProps {
  iconUrl?: string;
  name: string;
  description: string;
  sources: PackageSourceId[];
  kind?: "gui";
  contentType?: "game";
  category?: string;
  rating?: { average: number; count: number };
}

/**
 * A source dot-map: one small square per known source (`ALL_PACKAGE_SOURCE_IDS`),
 * always at the same grid position across every card, colored when this app
 * has that source and grayed out otherwise — 3 rows, as many columns as
 * `ALL_PACKAGE_SOURCE_IDS` needs. One tooltip over the whole grid rather than
 * per-square, listing the sources this app actually has.
 */
const SourceDotMap = component$<{ sources: PackageSourceId[] }>(({ sources }) => {
  const sourceSet = new Set(sources);
  const tip = sources.length
    ? sources.map((source) => SOURCE_LABELS[source]).join(", ")
    : "No sources available";

  return (
    <div class="tooltip tooltip-top" data-tip={tip} aria-label={tip}>
      <div class="grid grid-rows-3 grid-flow-col gap-px" aria-hidden="true">
        {ALL_PACKAGE_SOURCE_IDS.map((source) => (
          <span
            key={source}
            class={`w-1 h-1 rounded-[1px] ${sourceSet.has(source) ? "bg-primary" : "bg-base-300"}`}
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
  ({ iconUrl, name, description, sources, kind, contentType, category, rating }) => {
    return (
      <article class="card bg-base-100 border border-base-300 h-full transition-shadow hover:shadow-md hover:border-primary/40">
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
            {kind === "gui" && <span class="badge badge-secondary badge-sm">GUI</span>}
            {contentType === "game" && <span class="badge badge-accent badge-sm">Game</span>}
          </div>
        </div>
      </article>
    );
  },
);

import { component$ } from "@builder.io/qwik";
import { LuPackage } from "@qwikest/icons/lucide";
import { SOURCE_LABELS, type PackageSourceId } from "~/catalog-types";

export interface AppCardProps {
  iconUrl?: string;
  name: string;
  description: string;
  sources: PackageSourceId[];
  kind?: "gui";
  contentType?: "game";
}

/**
 * One unified card per app — the core Tuxery UX rule (init.md): even when
 * an app ships as Flatpak, Snap, *and* AppImage, it renders as exactly one
 * card here, with a badge per available source.
 */
export const AppCard = component$<AppCardProps>(
  ({ iconUrl, name, description, sources, kind, contentType }) => {
    return (
      <article class="card bg-base-100 border border-base-300 h-full transition-shadow hover:shadow-md hover:border-primary/40">
        <div class="card-body gap-2 p-5">
          <div class="w-14 h-14 rounded-field bg-base-200 flex items-center justify-center overflow-hidden shrink-0">
            {iconUrl ? (
              <img src={iconUrl} alt="" width={56} height={56} class="w-full h-full object-cover" />
            ) : (
              <LuPackage class="text-2xl text-base-content/40" />
            )}
          </div>
          <h3 class="card-title text-base line-clamp-1">{name}</h3>
          <p class="text-sm text-base-content/70 line-clamp-2">{description}</p>
          <div class="flex flex-wrap gap-1.5 mt-1">
            {kind === "gui" && <span class="badge badge-secondary badge-sm">GUI</span>}
            {contentType === "game" && <span class="badge badge-accent badge-sm">Game</span>}
            {sources.slice(0, 3).map((source) => (
              <span key={source} class="badge badge-outline badge-primary badge-sm">
                {SOURCE_LABELS[source]}
              </span>
            ))}
            {sources.length > 3 && (
              <span class="badge badge-ghost badge-sm">+{sources.length - 3}</span>
            )}
          </div>
        </div>
      </article>
    );
  },
);

import { component$ } from "@builder.io/qwik";
import { LuPackage } from "@qwikest/icons/lucide";
import { SOURCE_LABELS, type PackageSourceId } from "~/catalog";

export interface AppCardProps {
  iconUrl?: string;
  name: string;
  description: string;
  sources: PackageSourceId[];
}

/**
 * One unified card per app — the core Tuxery UX rule (init.md): even when
 * an app ships as Flatpak, Snap, *and* AppImage, it renders as exactly one
 * card here, with a badge per available source.
 */
export const AppCard = component$<AppCardProps>(({ iconUrl, name, description, sources }) => {
  return (
    <article class="card bg-base-100 border border-base-300 h-full">
      <div class="card-body gap-2 p-5">
        <div class="w-10 h-10 rounded-field bg-base-200 flex items-center justify-center overflow-hidden shrink-0">
          {iconUrl ? (
            <img src={iconUrl} alt="" width={40} height={40} class="w-full h-full object-cover" />
          ) : (
            <LuPackage class="text-xl text-base-content/40" />
          )}
        </div>
        <h3 class="card-title text-base">{name}</h3>
        <p class="text-sm text-base-content/70">{description}</p>
        <div class="flex flex-wrap gap-1.5 mt-1">
          {sources.map((source) => (
            <span key={source} class="badge badge-outline badge-primary badge-sm">
              {SOURCE_LABELS[source]}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
});

import { component$ } from "@builder.io/qwik";

export interface AppCardProps {
  icon: string;
  name: string;
  description: string;
  formats: string[];
}

/**
 * One unified card per app — the core Tuxery UX rule (init.md): even when
 * an app ships as Flatpak, Snap, *and* AppImage, it renders as exactly one
 * card here, with a badge per available format.
 */
export const AppCard = component$<AppCardProps>(({ icon, name, description, formats }) => {
  return (
    <article class="card bg-base-100 border border-base-300">
      <div class="card-body gap-2 p-5">
        <div class="text-3xl leading-none">{icon}</div>
        <h3 class="card-title text-base">{name}</h3>
        <p class="text-sm text-base-content/70">{description}</p>
        <div class="flex flex-wrap gap-1.5 mt-1">
          {formats.map((format) => (
            <span key={format} class="badge badge-outline badge-primary badge-sm">
              {format}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
});

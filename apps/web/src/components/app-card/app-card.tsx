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
    <article class="tuxery-card">
      <div class="tuxery-card-icon">{icon}</div>
      <h3 class="tuxery-card-name">{name}</h3>
      <p class="tuxery-card-description">{description}</p>
      <div class="tuxery-badges">
        {formats.map((format) => (
          <span key={format} class="tuxery-badge">
            {format}
          </span>
        ))}
      </div>
    </article>
  );
});

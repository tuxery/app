import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AppCard } from "~/components/app-card/app-card";
import { SearchBar } from "~/components/search-bar/search-bar";

const CATEGORIES = ["All", "Games", "Dev Tools", "Productivity", "Multimedia"];

/**
 * Placeholder catalog so the homepage renders something real. Not backed by
 * `@tuxery/sources`/`@tuxery/matcher` yet — see the "Homepage search UI"
 * card on the Tuxery GitHub Project for wiring this up to live data.
 */
const DEMO_APPS = [
  {
    icon: "🎮",
    name: "Discord",
    description: "Voice, video, and text chat for communities.",
    formats: ["Flatpak", "Snap"],
  },
  {
    icon: "🎵",
    name: "Spotify",
    description: "Stream music, podcasts, and playlists.",
    formats: ["Flatpak", "Snap", "AppImage"],
  },
  {
    icon: "🧩",
    name: "GIMP",
    description: "Free and open source image editor.",
    formats: ["Flatpak", "AppImage"],
  },
];

export default component$(() => {
  return (
    <>
      <SearchBar />

      <div class="tuxery-filters">
        {CATEGORIES.map((category, index) => (
          <span
            key={category}
            class="tuxery-filter"
            data-active={index === 0 ? "true" : "false"}
          >
            {category}
          </span>
        ))}
      </div>

      <div class="tuxery-grid">
        {DEMO_APPS.map((app) => (
          <AppCard
            key={app.name}
            icon={app.icon}
            name={app.name}
            description={app.description}
            formats={app.formats}
          />
        ))}
      </div>
    </>
  );
});

export const head: DocumentHead = {
  title: "Tuxery — the unified Linux App Store",
  meta: [
    {
      name: "description",
      content:
        "Tuxery aggregates Flatpak, Snap, AppImage and native Linux packages into one unified, deduplicated search engine.",
    },
  ],
};

import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AppCard } from "~/components/app-card/app-card";
import { getTrendingApps } from "~/catalog";

export const useTrendingGames = routeLoader$(async () => getTrendingApps("game"));

export default component$(() => {
  const trending = useTrendingGames();

  return (
    <div class="flex flex-col gap-10">
      <div>
        <h1 class="text-3xl font-bold mb-2">Games</h1>
        <p class="text-base-content/70">
          Confirmed Linux games only — see{" "}
          <a href="/browse/?type=game" class="link link-primary">
            the full games list
          </a>{" "}
          for everything, not just what's trending.
        </p>
      </div>

      {trending.value.length > 0 && (
        <section>
          <div class="flex items-baseline justify-between mb-3">
            <h2 class="text-lg font-semibold">Trending games</h2>
            <a href="/browse/?type=game" class="link link-primary text-sm">
              Browse all games →
            </a>
          </div>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
            {trending.value.slice(0, 12).map((game) => (
              <a key={game.id} href={`/app/${encodeURIComponent(game.id)}/`} class="block">
                <AppCard
                  iconUrl={game.iconUrl}
                  name={game.name}
                  description={game.shortDescription}
                  sources={game.sources}
                  packageCount={game.packageCount}
                  channels={game.channels}
                  contentType={game.contentType}
                  category={game.category}
                  rating={game.rating}
                />
              </a>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 class="text-lg font-semibold mb-2">Genre browsing</h2>
        <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
          Games mostly don't carry the same category data apps do (AppStream's own taxonomy excludes
          genre for anything tagged "Game"), so genre-level browsing needs its own taxonomy — still
          coming.
        </div>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Games — Tuxery",
  meta: [
    {
      name: "description",
      content: "Browse confirmed Linux games on Tuxery, including what's trending.",
    },
  ],
};

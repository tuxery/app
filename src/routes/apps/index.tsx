import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AppCard } from "~/components/app-card/app-card";
import { CategoryTileGrid } from "~/components/category-tile-grid/category-tile-grid";
import { getCategories, getTrendingApps } from "~/catalog";

export const useTrending = routeLoader$(async () => getTrendingApps("app"));
export const useCategories = routeLoader$(async () => getCategories("app"));

export default component$(() => {
  const trending = useTrending();
  const categories = useCategories();

  return (
    <div class="flex flex-col gap-10">
      <div>
        <h1 class="text-3xl font-bold mb-2">Apps</h1>
        <p class="text-base-content/70">
          Every Linux app, deduplicated across sources — everything not a confirmed{" "}
          <a href="/games/" class="link link-primary">
            game
          </a>
          .
        </p>
      </div>

      {trending.value.length > 0 && (
        <section>
          <div class="flex items-baseline justify-between mb-3">
            <h2 class="text-lg font-semibold">Trending apps</h2>
            <a href="/browse/?type=app" class="link link-primary text-sm">
              Browse all →
            </a>
          </div>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
            {trending.value.slice(0, 12).map((app) => (
              <a key={app.id} href={`/app/${encodeURIComponent(app.id)}/`} class="block">
                <AppCard
                  iconUrl={app.iconUrl}
                  name={app.name}
                  description={app.shortDescription}
                  sources={app.sources}
                  packageCount={app.packageCount}
                  channels={app.channels}
                  contentType={app.contentType}
                  category={app.category}
                  rating={app.rating}
                  ratingsBySource={app.ratingsBySource}
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {categories.value.length > 0 && (
        <section>
          <h2 class="text-lg font-semibold mb-3">Browse by category</h2>
          <CategoryTileGrid categories={categories.value} />
        </section>
      )}

      <section>
        <h2 class="text-lg font-semibold mb-2">Editorial picks</h2>
        <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
          Staff-curated "must-have" collections are coming soon.
        </div>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Apps — Tuxery",
  meta: [
    {
      name: "description",
      content: "Browse Linux apps on Tuxery — trending picks and category browsing.",
    },
  ],
};

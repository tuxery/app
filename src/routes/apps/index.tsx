import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AppCard } from "~/components/app-card/app-card";
import { getCategories, getTrendingApps } from "~/catalog";

export const useTrending = routeLoader$(async () => getTrendingApps("app"));
export const useCategories = routeLoader$(async () => getCategories());

export default component$(() => {
  const trending = useTrending();
  const categories = useCategories();

  return (
    <div class="flex flex-col gap-10">
      <div>
        <h1 class="text-3xl font-bold mb-2">Apps</h1>
        <p class="text-base-content/70">
          General-purpose Linux apps, deduplicated across sources — a best-effort split by category
          (not a guarantee), separate from{" "}
          <a href="/games/" class="link link-primary">
            Games
          </a>{" "}
          and{" "}
          <a href="/utils/" class="link link-primary">
            Utils
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
                  contentType={app.contentType}
                  category={app.category}
                  rating={app.rating}
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {categories.value.length > 0 && (
        <section>
          <h2 class="text-lg font-semibold mb-3">Browse by category</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.value.map((c) => (
              <a
                key={c.category}
                href={`/browse/?category=${encodeURIComponent(c.category)}`}
                aria-label={`Browse ${c.category} (${c.count} apps)`}
                class="card bg-base-100 border border-base-300 hover:border-primary/40 hover:shadow-md transition-shadow"
              >
                <div class="card-body p-4 flex-row items-center justify-between">
                  <span class="font-medium">{c.category}</span>
                  <span class="badge badge-ghost">{c.count.toLocaleString()}</span>
                </div>
              </a>
            ))}
          </div>
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

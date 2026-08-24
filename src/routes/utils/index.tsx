import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AppCard } from "~/components/app-card/app-card";
import { getTrendingApps } from "~/catalog";

export const useTrendingUtils = routeLoader$(async () => getTrendingApps("utility"));

export default component$(() => {
  const trending = useTrendingUtils();

  return (
    <div class="flex flex-col gap-10">
      <div>
        <h1 class="text-3xl font-bold mb-2">Utils</h1>
        <p class="text-base-content/70">
          System tools, settings panels, and developer tooling — a best-effort split by category
          (not a guarantee), separate from{" "}
          <a href="/apps/" class="link link-primary">
            Apps
          </a>
          . See{" "}
          <a href="/browse/?type=utility" class="link link-primary">
            the full utils list
          </a>{" "}
          for everything, not just what's trending.
        </p>
      </div>

      {trending.value.length > 0 && (
        <section>
          <div class="flex items-baseline justify-between mb-3">
            <h2 class="text-lg font-semibold">Trending utils</h2>
            <a href="/browse/?type=utility" class="link link-primary text-sm">
              Browse all utils →
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

      <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
        Apps/Games/Utils today is split by category (Development, System tools, Settings, and
        Utilities count as "Utils") — a rough first cut, not a confirmed CLI-tools-only signal. The
        "GUI"/"CLI" filter on{" "}
        <a href="/browse/" class="link link-primary">
          Browse
        </a>{" "}
        is the same kind of best-effort split, independent of this one.
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Utils — Tuxery",
  meta: [
    {
      name: "description",
      content: "Browse Linux system tools and utilities on Tuxery, including what's trending.",
    },
  ],
};

import { component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import { CategoryTileGrid } from "~/components/category-tile-grid/category-tile-grid";
import { SectionMagazine } from "~/components/section-magazine/section-magazine";
import { getCategories, getStats } from "~/catalog";
import { parseHomeRows, type HomeRows } from "~/home-rows";
import { resolveServerEnv } from "~/server-env";

export const useStats = routeLoader$(async (requestEvent) =>
  getStats(resolveServerEnv(requestEvent.platform)),
);
export const useCategories = routeLoader$(async (requestEvent) =>
  getCategories(resolveServerEnv(requestEvent.platform), "app"),
);

export default component$(() => {
  const stats = useStats();
  const categories = useCategories();
  // The same rows as the homepage, from the same edge-cached `/api/home/`
  // response (see `~/home-rows`): `undefined` while they load.
  const rows = useSignal<HomeRows>();
  const generation = stats.value.generatedAt.replaceAll(/\D/g, "");
  useVisibleTask$(async () => {
    try {
      const response = await fetch(`/api/home/?g=${generation}`);
      rows.value = parseHomeRows(response.ok ? await response.json() : {});
    } catch {
      rows.value = parseHomeRows({});
    }
  });
  const available = new Set(categories.value.map(({ category }) => category));

  return (
    <div class="flex flex-col gap-10">
      <div>
        <h1 class="text-3xl font-bold mb-2">Apps</h1>
        <p class="text-base-content/70">
          Every Linux app, deduplicated across sources — everything not confirmed as a game. See{" "}
          <a href="/browse/?type=app" class="link link-primary">
            the full apps list
          </a>{" "}
          for everything, not just what's trending.
        </p>
      </div>

      {stats.value.total > 0 && (
        <SectionMagazine section="apps" rows={rows.value} available={available} />
      )}

      {categories.value.length > 0 && (
        <section>
          <h2 class="text-lg font-semibold mb-3">Browse by category</h2>
          <CategoryTileGrid categories={categories.value} />
        </section>
      )}
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

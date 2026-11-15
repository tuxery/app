import { component$ } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import { CategoryTileGrid } from "~/components/category-tile-grid/category-tile-grid";
import { getCategories } from "~/catalog";
import { resolveServerEnv } from "~/server-env";

export const useAppCategories = routeLoader$(async (requestEvent) =>
  getCategories(resolveServerEnv(requestEvent.platform), "app"),
);
export const useGameCategories = routeLoader$(async (requestEvent) =>
  getCategories(resolveServerEnv(requestEvent.platform), "game"),
);

export default component$(() => {
  const appCategories = useAppCategories();
  const gameCategories = useGameCategories();

  return (
    <div class="flex flex-col gap-8">
      <div>
        <h1 class="text-3xl font-bold mb-2">Categories</h1>
        <p class="text-base-content/70">
          Apps and games each draw from their own taxonomy, built from each app's own AppStream
          categories where a source carries them, and otherwise from a classifier that reads its
          name and description. The few left without a confident guess wait in{" "}
          <a href="/browse/?category=To+Classify" class="link link-primary">
            To Classify
          </a>{" "}
          rather than being filed in the wrong place.
        </p>
      </div>

      {appCategories.value.length === 0 && gameCategories.value.length === 0 ? (
        <p class="text-base-content/70">No category data loaded yet.</p>
      ) : (
        <>
          {appCategories.value.length > 0 && (
            <section>
              <h2 class="text-lg font-semibold mb-3">Apps</h2>
              <CategoryTileGrid categories={appCategories.value} />
            </section>
          )}

          {gameCategories.value.length > 0 && (
            <section>
              <h2 class="text-lg font-semibold mb-3">Games</h2>
              <CategoryTileGrid categories={gameCategories.value} />
            </section>
          )}
        </>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Categories — Tuxery",
  meta: [
    {
      name: "description",
      content: "Browse the Tuxery catalog by category.",
    },
  ],
};

import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { CategoryTileGrid } from "~/components/category-tile-grid/category-tile-grid";
import { getCategories } from "~/catalog";

export const useAppCategories = routeLoader$(async () => getCategories("app"));
export const useGameCategories = routeLoader$(async () => getCategories("game"));

export default component$(() => {
  const appCategories = useAppCategories();
  const gameCategories = useGameCategories();

  return (
    <div class="flex flex-col gap-8">
      <div>
        <h1 class="text-3xl font-bold mb-2">Categories</h1>
        <p class="text-base-content/70">
          Apps and games each draw from their own taxonomy, sourced from each app's own AppStream
          metadata whenever the source data actually carries one — coverage is uneven (only Flathub
          and elementary AppCenter populate it today), so most of the catalog lands in{" "}
          <a href="/browse/?category=To+Classify" class="link link-primary">
            To Classify
          </a>{" "}
          rather than a guess.
        </p>
      </div>

      {appCategories.value.length === 0 && gameCategories.value.length === 0 ? (
        <p class="text-base-content/60">No category data loaded yet.</p>
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

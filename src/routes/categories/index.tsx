import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { getCategories } from "~/catalog";

export const useCategories = routeLoader$(async () => getCategories());

export default component$(() => {
  const categories = useCategories();

  return (
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-3xl font-bold mb-2">Categories</h1>
        <p class="text-base-content/70">
          Sourced from each app's own AppStream metadata, mapped to a small, deliberately
          conservative set of display categories (freedesktop.org's Main Categories only) — apps,
          games, and CLI utilities alike, whenever the source data actually carries one. Coverage is
          uneven: games rarely carry a Main Category upstream (freedesktop's own convention drops it
          once something is tagged "Game"), and there's no reliable way yet to tell a CLI tool apart
          from a GUI app in the first place — so both are under-represented here, not excluded, and
          will fill in as the catalog's own signal improves.
        </p>
      </div>

      {categories.value.length === 0 ? (
        <p class="text-base-content/60">No category data loaded yet.</p>
      ) : (
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.value.map((c) => (
            <a
              key={c.category}
              href={`/browse/?category=${encodeURIComponent(c.category)}`}
              aria-label={`Browse ${c.category} (${c.count} apps)`}
              class="card bg-base-100 border border-base-300 hover:border-primary/40 hover:shadow-md transition-shadow"
            >
              <div class="card-body p-5 flex-row items-center justify-between">
                <span class="font-medium">{c.category}</span>
                <span class="badge badge-ghost">{c.count.toLocaleString()}</span>
              </div>
            </a>
          ))}
        </div>
      )}

      <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
        Looking for games specifically? A genre-level taxonomy (Puzzle, Casual, Strategy, ...) isn't
        built yet, but{" "}
        <a href="/games/" class="link link-primary">
          Games
        </a>{" "}
        lists every confirmed game regardless of category.
      </div>
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

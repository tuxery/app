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
          conservative set of display categories (freedesktop.org's Main Categories only) — more
          will show up here as the catalog's category coverage grows.
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

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
          <span class="font-medium text-base-content">Games</span> aren't in the grid above —
          AppStream's own taxonomy excludes genre for anything tagged "Game", so genre-level
          browsing needs its own taxonomy, still coming. See{" "}
          <a href="/games/" class="link link-primary">
            Games
          </a>{" "}
          in the meantime.
        </div>
        <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
          <span class="font-medium text-base-content">CLI tools</span> aren't reliably
          distinguishable from GUI apps yet either — see{" "}
          <a href="/utils/" class="link link-primary">
            Utils
          </a>{" "}
          for why.
        </div>
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

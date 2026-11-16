import { component$ } from "@qwik.dev/core";
import type { CategoryCount } from "~/catalog";
import { CategoryIcon } from "~/components/category-icon/category-icon";

/**
 * A grid of category tiles, each linking to `/browse/?category=...` —
 * shared by the homepage's "Browse by category" section, the Apps/Games
 * pages' own category grids, and the full `/categories` listing. Callers
 * decide their own empty-state handling (an empty grid here would just be
 * a blank box) — pass a non-empty `categories` array.
 */
export const CategoryTileGrid = component$<{ categories: CategoryCount[] }>(({ categories }) => (
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
    {categories.map((c) => (
      <a
        key={c.category}
        href={`/browse/?category=${encodeURIComponent(c.category)}`}
        aria-label={`Browse ${c.category} (${c.count} apps)`}
        class="card bg-base-100 border border-base-300 hover:border-primary/40 hover:shadow-md transition-shadow"
      >
        <div class="card-body p-4 flex-row items-center justify-between gap-2">
          <span class="flex items-center gap-2 min-w-0">
            <CategoryIcon category={c.category} class="text-lg text-primary shrink-0" />
            <span class="font-medium">{c.category}</span>
          </span>
          <span class="badge badge-ghost">{c.count.toLocaleString()}</span>
        </div>
      </a>
    ))}
  </div>
));

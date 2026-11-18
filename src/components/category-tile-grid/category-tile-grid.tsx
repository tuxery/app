import { component$ } from "@qwik.dev/core";
import type { CategoryCount } from "~/catalog";
import { categoryPageHref } from "~/categories";
import { CategoryIcon } from "~/components/category-icon/category-icon";

/**
 * A grid of compact category tiles (icon, name, count), each leading to the
 * category's page — the homepage's "Browse by category" grid and the
 * Apps/Games pages' own. Callers decide their own empty-state handling (an
 * empty grid here would just be a blank box) — pass a non-empty
 * `categories` array.
 */
export const CategoryTileGrid = component$<{ categories: CategoryCount[] }>(({ categories }) => (
  <ul class="grid gap-2 grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
    {categories.map((c) => (
      <li key={c.category} class="min-w-0">
        <a
          href={categoryPageHref(c.category)}
          aria-label={`${c.category} (${c.count.toLocaleString()})`}
          class="flex items-center gap-2 rounded-box border border-base-300 bg-base-100 px-3 py-2 hover:border-primary/50 hover:shadow-sm transition-shadow"
        >
          <CategoryIcon category={c.category} class="text-primary shrink-0" />
          <span class="truncate text-sm font-medium" title={c.category}>
            {c.category}
          </span>
          <span class="ml-auto text-xs text-base-content/70 tabular-nums">
            {c.count.toLocaleString()}
          </span>
        </a>
      </li>
    ))}
  </ul>
));

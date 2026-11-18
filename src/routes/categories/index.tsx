import { component$ } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import { CategoryIcon } from "~/components/category-icon/category-icon";
import { getCategories, getSubcategories } from "~/catalog";
import { categoryDirectory, categoryPageHref, orderSubcategories } from "~/categories";
import { resolveServerEnv } from "~/server-env";

export const useAppCategories = routeLoader$(async (requestEvent) =>
  getCategories(resolveServerEnv(requestEvent.platform), "app"),
);
export const useGameCategories = routeLoader$(async (requestEvent) =>
  getCategories(resolveServerEnv(requestEvent.platform), "game"),
);
export const useSubcategories = routeLoader$(async (requestEvent) =>
  getSubcategories(resolveServerEnv(requestEvent.platform), "all"),
);

/**
 * Every category as a directory: the app groups, then the game genres,
 * each category with all its subcategories and their counts, each name
 * leading to its page. Three cached `meta` reads, nothing per category.
 */
export default component$(() => {
  const appCategories = useAppCategories();
  const gameCategories = useGameCategories();
  const subcategories = useSubcategories();
  const directory = categoryDirectory(appCategories.value, gameCategories.value);
  const subcategoriesOf = (category: string) =>
    orderSubcategories(subcategories.value.filter((s) => s.category === category));

  return (
    <div class="flex flex-col gap-10">
      <header class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold">Categories</h1>
        <p class="text-base-content/70 max-w-3xl">
          Every app and game, filed by what it's for. Pick a category for its top 10 and everything
          in it, or go straight to one of its subcategories. Apps without a confident category yet
          wait in{" "}
          <a href="/browse/?category=To+Classify" class="link link-primary">
            To Classify
          </a>{" "}
          rather than being filed in the wrong place.
        </p>
        {directory.length > 1 && (
          <nav aria-label="Category groups" class="flex flex-wrap gap-2 mt-2">
            {directory.map(({ group }) => (
              <a key={group.id} href={`#${group.id}`} class="btn btn-sm btn-ghost">
                {group.title}
              </a>
            ))}
          </nav>
        )}
      </header>

      {directory.length === 0 ? (
        <p class="text-base-content/70">No category data loaded yet.</p>
      ) : (
        directory.map(({ group, items }) => (
          <section
            key={group.id}
            id={group.id}
            aria-labelledby={`group-${group.id}`}
            class="scroll-mt-20 flex flex-col gap-4"
          >
            <h2 id={`group-${group.id}`} class="text-xl font-bold border-b border-base-300 pb-2">
              {group.title}
            </h2>
            <div class="columns-1 sm:columns-2 lg:columns-3 gap-8">
              {items.map(({ category, count }) => {
                const subs = subcategoriesOf(category);
                return (
                  <div key={category} class="break-inside-avoid mb-6">
                    <h3>
                      <a
                        href={categoryPageHref(category)}
                        class="inline-flex items-center gap-2 group"
                      >
                        <CategoryIcon category={category} class="text-primary text-lg" />
                        <span class="font-bold group-hover:underline">{category}</span>
                        <span class="text-xs font-normal text-base-content/70 tabular-nums">
                          {count.toLocaleString()}
                        </span>
                      </a>
                    </h3>
                    {subs.length > 0 && (
                      <ul class="mt-1.5 ml-7 flex flex-col gap-0.5 text-sm">
                        {subs.map((s) => (
                          <li key={s.subcategory} class="flex justify-between gap-2">
                            <a
                              href={categoryPageHref(category, s.subcategory)}
                              class="link link-hover truncate"
                            >
                              {s.subcategory}
                            </a>
                            <span class="text-xs text-base-content/70 tabular-nums">
                              {s.count.toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Categories — Tuxery",
  meta: [
    {
      name: "description",
      content:
        "Every Linux app and game on Tuxery by category and subcategory, from web browsers to role-playing games.",
    },
  ],
};

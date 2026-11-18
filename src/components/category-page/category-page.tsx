import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { LuArrowRight, LuChevronRight } from "@qwikest/icons/lucide";
import { AppCardLink } from "~/components/app-card/app-card";
import { CategoryIcon } from "~/components/category-icon/category-icon";
import { AppIcon, SectionHeader } from "~/components/home-sections/home-sections";
import { BROWSE_PAGE_SIZE, type AppSummary, type BrowseResult } from "~/catalog-types";
import { categoryPageHref, subcategoryHref } from "~/categories";

/** A subcategory with its count and its most popular products. */
export interface SubcategoryEntry {
  subcategory: string;
  count: number;
  apps: AppSummary[];
}

/** What a page's count counts: "apps" or "games". */
export const unitOf = (isGame: boolean) => (isGame ? "games" : "apps");

/**
 * A category page's head: the trail from /apps or /games, the category's
 * icon, its name (or the subcategory's), how many products and, on a
 * category's own page, its one-line blurb.
 */
export const CategoryHeader = component$<{
  category: string;
  subcategory?: string;
  isGame: boolean;
  count: number;
  blurb?: string;
}>(({ category, subcategory, isGame, count, blurb }) => (
  <header class="rounded-box bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10 border border-base-300 p-6 sm:p-8 flex flex-col gap-3">
    <nav aria-label="Breadcrumb" class="text-sm text-base-content/70">
      <ol class="flex items-center gap-1 flex-wrap">
        <li>
          <a href={isGame ? "/games/" : "/apps/"} class="link link-hover">
            {isGame ? "Games" : "Apps"}
          </a>
        </li>
        <li class="flex items-center gap-1">
          <LuChevronRight aria-hidden="true" />
          {subcategory ? (
            <a href={categoryPageHref(category)} class="link link-hover">
              {category}
            </a>
          ) : (
            <span aria-current="page">{category}</span>
          )}
        </li>
        {subcategory && (
          <li class="flex items-center gap-1">
            <LuChevronRight aria-hidden="true" />
            <span aria-current="page">{subcategory}</span>
          </li>
        )}
      </ol>
    </nav>
    <div class="flex items-center gap-4">
      <span class="size-14 shrink-0 rounded-box bg-base-100 text-primary inline-flex items-center justify-center shadow-sm">
        <CategoryIcon category={category} class="text-3xl" />
      </span>
      <div class="min-w-0">
        <h1 class="text-3xl sm:text-4xl font-extrabold leading-tight text-balance">
          {subcategory ?? category}
        </h1>
        <p class="text-base-content/70 tabular-nums">
          {count.toLocaleString()} {unitOf(isGame)}
        </p>
      </div>
    </div>
    {blurb && <p class="max-w-2xl text-base-content/80">{blurb}</p>}
  </header>
));

/**
 * "Narrow it down": one line per subcategory, with three of its icons, the
 * names of its first apps and its count, each leading to its page.
 */
export const SubcategoryLines = component$<{ category: string; subcategories: SubcategoryEntry[] }>(
  ({ category, subcategories }) => (
    <section aria-labelledby="category-narrow">
      <h2 id="category-narrow" class="text-xl font-bold mb-4">
        Narrow it down
      </h2>
      <ul class="flex flex-col gap-2">
        {subcategories.map(({ subcategory, count, apps }) => (
          <li key={subcategory}>
            <a
              href={categoryPageHref(category, subcategory)}
              class="flex items-center gap-3 rounded-box border border-base-300 bg-base-100 p-3 hover:border-primary/50 hover:shadow-md transition-shadow"
            >
              <span class="flex -space-x-2 shrink-0 min-w-[5.5rem]" aria-hidden="true">
                {apps.slice(0, 3).map((app) => (
                  <AppIcon
                    key={app.id}
                    app={app}
                    size={32}
                    class="ring-2 ring-base-100 bg-base-100 p-0.5"
                  />
                ))}
              </span>
              <span class="min-w-0 flex-1">
                <span class="block font-semibold truncate">{subcategory}</span>
                {apps.length > 0 && (
                  <span class="block text-xs text-base-content/70 truncate">
                    {apps
                      .slice(0, 3)
                      .map((app) => app.name)
                      .join(", ")}
                    …
                  </span>
                )}
              </span>
              <span class="text-sm text-base-content/70 tabular-nums">
                {count.toLocaleString()}
              </span>
              <LuArrowRight aria-hidden="true" class="text-base-content/50 shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  ),
);

/** The other subcategories of a category, as tiles: name, count, five icons. */
export const SubcategoryTiles = component$<{
  category: string;
  title: string;
  subcategories: SubcategoryEntry[];
}>(({ category, title, subcategories }) => (
  <section>
    <SectionHeader title={title} href={categoryPageHref(category)} linkLabel="All" level={2} />
    <ul class="grid gap-3 grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3">
      {subcategories.map(({ subcategory, count, apps }) => (
        <li key={subcategory} class="min-w-0">
          <a
            href={categoryPageHref(category, subcategory)}
            class="flex flex-col gap-3 h-full rounded-box border border-base-300 bg-base-100 p-4 hover:border-primary/50 hover:shadow-md transition-shadow"
          >
            <span class="min-w-0">
              <span class="block font-semibold leading-tight truncate">{subcategory}</span>
              <span class="block text-xs text-base-content/70 tabular-nums">
                {count.toLocaleString()}
              </span>
            </span>
            <span class="flex -space-x-2 min-h-9" aria-hidden="true">
              {apps.slice(0, 5).map((app) => (
                <AppIcon
                  key={app.id}
                  app={app}
                  size={36}
                  class="ring-2 ring-base-100 bg-base-100 p-0.5"
                />
              ))}
            </span>
          </a>
        </li>
      ))}
    </ul>
  </section>
));

/**
 * Every product of the category (or subcategory), as /browse lists them,
 * popular first: the first page rendered with the page, the next ones
 * fetched from `/api/category-listing/` as the visitor nears the end.
 * Searching and filtering are /browse's; a link leads there with the
 * category already picked.
 */
export const CategoryListing = component$<{
  category: string;
  subcategory?: string;
  isGame: boolean;
  first: BrowseResult;
}>(({ category, subcategory, isGame, first }) => {
  const apps = useSignal<AppSummary[]>(first.apps);
  // 1-based, like /browse's `?page=`: the first page came with the page.
  const nextPage = useSignal(2);
  const hasMore = useSignal(
    first.apps.length === BROWSE_PAGE_SIZE && first.apps.length < first.total,
  );
  const loading = useSignal(false);
  const sentinelRef = useSignal<HTMLElement>();
  // Built while rendering, so the handler below captures a plain string.
  const params = new URLSearchParams({ category });
  if (subcategory) params.set("sub", subcategory);
  const listingUrl = `/api/category-listing/?${params}`;
  const total = first.total;

  const loadMore = $(async () => {
    if (loading.value || !hasMore.value) return;
    loading.value = true;
    try {
      const response = await fetch(`${listingUrl}&page=${nextPage.value}`);
      const page = response.ok ? ((await response.json()) as { apps?: AppSummary[] }).apps : [];
      const more = Array.isArray(page) ? page : [];
      apps.value = [...apps.value, ...more];
      nextPage.value += 1;
      hasMore.value = more.length === BROWSE_PAGE_SIZE && apps.value.length < total;
    } catch {
      // Offline or the server failed: leave the button to try again.
    }
    loading.value = false;
  });

  useVisibleTask$(({ track, cleanup }) => {
    track(() => hasMore.value);
    const el = sentinelRef.value;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore();
    });
    observer.observe(el);
    cleanup(() => observer.disconnect());
  });

  return (
    <section aria-labelledby="category-all">
      <div class="flex items-end justify-between gap-3 mb-4">
        <h2 id="category-all" class="text-xl font-bold">
          All {first.total.toLocaleString()} {unitOf(isGame)}
        </h2>
        <a
          href={
            subcategory
              ? subcategoryHref(category, subcategory)
              : `/browse/?category=${encodeURIComponent(category)}`
          }
          class="link link-primary text-sm shrink-0 inline-flex items-center gap-1"
        >
          Search and filter <LuArrowRight aria-hidden="true" />
        </a>
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
        {apps.value.map((app) => (
          <AppCardLink key={app.id} app={app} />
        ))}
      </div>
      {hasMore.value && (
        <div ref={sentinelRef} class="flex justify-center py-8">
          <button type="button" class="btn btn-ghost btn-sm" onClick$={loadMore}>
            {loading.value ? (
              <span class="loading loading-spinner loading-sm" aria-label="Loading" />
            ) : (
              "Show more"
            )}
          </button>
        </div>
      )}
    </section>
  );
});

import { component$ } from "@qwik.dev/core";
import { routeLoader$, type DocumentHead } from "@qwik.dev/router";
import {
  CategoryHeader,
  CategoryListing,
  SubcategoryLines,
  unitOf,
} from "~/components/category-page/category-page";
import { RankedList, SectionHeader } from "~/components/home-sections/home-sections";
import { browseApps, getAppsByCategory } from "~/catalog";
import { categoryContext, withPreviews } from "~/category-pages";
import { categoryBlurb } from "~/data/category-blurbs";
import { resolveServerEnv } from "~/server-env";

/**
 * A category's page: its most popular products as a numbered top 10, its
 * subcategories as the way to narrow it down, then every product of the
 * category. All from precomputed lists: the category's preview, the
 * subcategories' first pages and the category's own /browse pages.
 */
export const useCategoryPage = routeLoader$(async (requestEvent) => {
  const env = resolveServerEnv(requestEvent.platform);
  const context = await categoryContext(env, requestEvent.params.category ?? "");
  if (!context) {
    requestEvent.status(404);
    return null;
  }
  const [top, subcategories, first] = await Promise.all([
    getAppsByCategory(env, context.category),
    withPreviews(env, context.category, context.subcategories),
    browseApps(env, "", 0, { category: context.category }),
  ]);
  return { ...context, top: top.slice(0, 10), subcategories, first };
});

export default component$(() => {
  const page = useCategoryPage().value;
  if (!page) return <p class="text-base-content/70">Category not found.</p>;
  const { category, isGame, count, top, subcategories, first } = page;
  const hasSubcategories = subcategories.length > 0;

  return (
    <div class="flex flex-col gap-10">
      <CategoryHeader
        category={category}
        isGame={isGame}
        count={count}
        blurb={categoryBlurb(category, category)}
      />
      {(top.length > 0 || hasSubcategories) && (
        <div class={["grid gap-8 items-start", hasSubcategories && "lg:grid-cols-2"]}>
          {top.length > 0 && (
            <section>
              <SectionHeader eyebrow="Top 10" title={`Most popular ${unitOf(isGame)}`} level={2} />
              <RankedList
                apps={top}
                label={`Most popular ${unitOf(isGame)}`}
                columns={hasSubcategories ? 1 : 2}
              />
            </section>
          )}
          {hasSubcategories && (
            <SubcategoryLines category={category} subcategories={subcategories} />
          )}
        </div>
      )}
      <CategoryListing category={category} isGame={isGame} first={first} />
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const page = resolveValue(useCategoryPage);
  return {
    title: page
      ? `${page.category} ${unitOf(page.isGame)} for Linux — Tuxery`
      : "Not found — Tuxery",
    meta: page
      ? [{ name: "description", content: categoryBlurb(page.category, page.category) }]
      : [],
  };
};

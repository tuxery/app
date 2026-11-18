import { component$ } from "@qwik.dev/core";
import { routeLoader$, type DocumentHead } from "@qwik.dev/router";
import {
  CategoryHeader,
  CategoryListing,
  SubcategoryTiles,
  unitOf,
} from "~/components/category-page/category-page";
import { RankedList, SectionHeader } from "~/components/home-sections/home-sections";
import { browseApps } from "~/catalog";
import { categoryContext, withPreviews } from "~/category-pages";
import { labelForSlug } from "~/categories";
import { resolveServerEnv } from "~/server-env";

/**
 * A subcategory's page, the category's page in small: its top 10, the
 * category's other subcategories, then every product in it (last, since
 * it keeps loading as the visitor scrolls).
 */
export const useSubcategoryPage = routeLoader$(async (requestEvent) => {
  const env = resolveServerEnv(requestEvent.platform);
  const context = await categoryContext(env, requestEvent.params.category ?? "");
  const label =
    context &&
    labelForSlug(
      context.subcategories.map(({ subcategory }) => subcategory),
      requestEvent.params.subcategory ?? "",
    );
  const current = context?.subcategories.find(({ subcategory }) => subcategory === label);
  if (!context || !current) {
    requestEvent.status(404);
    return null;
  }
  const [entries, first] = await Promise.all([
    withPreviews(env, context.category, context.subcategories),
    browseApps(env, "", 0, { category: context.category, subcategory: current.subcategory }),
  ]);
  return {
    category: context.category,
    isGame: context.isGame,
    subcategory: current.subcategory,
    count: current.count,
    // The subcategory's first page is popular first too: its top 10.
    top: first.apps.slice(0, 10),
    siblings: entries.filter(({ subcategory }) => subcategory !== current.subcategory),
    first,
  };
});

export default component$(() => {
  const page = useSubcategoryPage().value;
  if (!page) return <p class="text-base-content/70">Category not found.</p>;
  const { category, subcategory, isGame, count, top, siblings, first } = page;

  return (
    <div class="flex flex-col gap-10">
      <CategoryHeader category={category} subcategory={subcategory} isGame={isGame} count={count} />
      {top.length > 0 && (
        <section>
          <SectionHeader eyebrow="Top 10" title={`Most popular in ${subcategory}`} level={2} />
          <RankedList apps={top} label={`Most popular in ${subcategory}`} />
        </section>
      )}
      {siblings.length > 0 && (
        <SubcategoryTiles
          category={category}
          title={`More in ${category}`}
          subcategories={siblings}
        />
      )}
      <CategoryListing
        category={category}
        subcategory={subcategory}
        isGame={isGame}
        first={first}
      />
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const page = resolveValue(useSubcategoryPage);
  return {
    title: page
      ? `${page.subcategory} — ${page.category} ${unitOf(page.isGame)} for Linux — Tuxery`
      : "Not found — Tuxery",
    meta: page
      ? [
          {
            name: "description",
            content: `${page.count.toLocaleString()} ${page.subcategory.toLowerCase()} ${unitOf(page.isGame)} for Linux, from every source that packages them.`,
          },
        ]
      : [],
  };
};

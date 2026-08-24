import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuSearch } from "@qwikest/icons/lucide";
import { AppCard } from "~/components/app-card/app-card";
import { HorizontalScroller } from "~/components/horizontal-scroller/horizontal-scroller";
import { getStats, getTrendingApps, getCategories, getAppsByCategory } from "~/catalog";
import { useHeroBackground } from "~/routes/layout";
import type { AppSummary } from "~/catalog-types";

export const useStats = routeLoader$(async () => {
  return getStats();
});

export const useTrendingApps = routeLoader$(async () => {
  return getTrendingApps();
});

export const useCategories = routeLoader$(async () => {
  return getCategories();
});

// One loader per curated row on the "Homepage: full section layout" board
// card — Qwik City loaders have to be individually exported consts, not
// built from a loop. Category strings match enrich/category.ts's
// CATEGORY_LABELS on the catalog side exactly (kept in sync by hand, same
// convention as catalog-types.ts's own mirrors).
export const useProductivityApps = routeLoader$(async () => getAppsByCategory("Productivity"));
export const useCreativityApps = routeLoader$(async () =>
  getAppsByCategory("Graphics & Creativity"),
);
export const useLearningApps = routeLoader$(async () => getAppsByCategory("Education"));
export const useMultimediaApps = routeLoader$(async () => getAppsByCategory("Multimedia"));
export const useSocialApps = routeLoader$(async () =>
  getAppsByCategory("Internet & Communication"),
);

const AppCardLink = component$<{ app: AppSummary }>(({ app }) => (
  <a href={`/app/${encodeURIComponent(app.id)}/`} class="block w-64 shrink-0 snap-start">
    <AppCard
      iconUrl={app.iconUrl}
      name={app.name}
      description={app.shortDescription}
      sources={app.sources}
      contentType={app.contentType}
      category={app.category}
      rating={app.rating}
    />
  </a>
));

/** A curated-by-category row (Productivity, Creativity, ...) — real data, not a placeholder, but honest about showing nothing when a category happens to be empty rather than hiding the whole section. */
const CategoryRow = component$<{ title: string; category: string; apps: AppSummary[] }>(
  ({ title, category, apps }) => (
    <section>
      <div class="flex items-baseline justify-between mb-3">
        <h2 class="text-lg font-semibold">{title}</h2>
        <a
          href={`/browse/?category=${encodeURIComponent(category)}`}
          class="link link-primary text-sm"
        >
          Browse all →
        </a>
      </div>
      {apps.length === 0 ? (
        <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
          No {title.toLowerCase()} catalogued yet.
        </div>
      ) : (
        <HorizontalScroller ariaLabel={title}>
          {apps.map((app) => (
            <AppCardLink key={app.id} app={app} />
          ))}
        </HorizontalScroller>
      )}
    </section>
  ),
);

const ComingSoonSection = component$<{ title: string; note: string }>(({ title, note }) => (
  <section>
    <h2 class="text-lg font-semibold mb-2">{title}</h2>
    <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
      {note}
    </div>
  </section>
));

export default component$(() => {
  const stats = useStats();
  const trendingApps = useTrendingApps();
  const categories = useCategories();
  const heroBackground = useHeroBackground();
  const bg = heroBackground.value;
  const productivityApps = useProductivityApps();
  const creativityApps = useCreativityApps();
  const learningApps = useLearningApps();
  const multimediaApps = useMultimediaApps();
  const socialApps = useSocialApps();

  return (
    <div class="flex flex-col gap-14">
      <section class="hero rounded-box px-4 md:px-6">
        <div class={`hero-content text-center py-14 ${bg ? "text-white" : ""}`}>
          <div class="max-w-2xl">
            <h1 class="text-4xl md:text-5xl font-bold text-nowrap">
              Search <span class="text-primary">every</span> Linux app.
            </h1>
            <p class={`py-4 ${bg ? "text-white/80" : "text-base-content/70"}`}>
              Tuxery aggregates Flathub, the Snap Store, AppImage, and every distro's own repos into
              one catalog — search once, install from wherever it's shipped.
            </p>
            <form action="/browse" method="get" class="flex justify-center">
              <label class="input input-lg w-full max-w-md flex items-center gap-2">
                <LuSearch class="text-base-content/50" />
                <input
                  type="search"
                  name="q"
                  placeholder="Search for an app or game…"
                  aria-label="Search for an app"
                  class="grow"
                />
              </label>
            </form>
            {stats.value.total > 0 && (
              <p class={`text-sm mt-4 ${bg ? "text-white/60" : "text-base-content/50"}`}>
                {stats.value.total.toLocaleString()} apps, games and utils catalogued
              </p>
            )}
          </div>
        </div>
      </section>

      {stats.value.total === 0 ? (
        <p class="text-center text-base-content/60">
          No catalog data loaded — run <code class="font-mono">pnpm seed</code> then{" "}
          <code class="font-mono">pnpm serve</code> in <code class="font-mono">tuxery/catalog</code>{" "}
          first.
        </p>
      ) : (
        <>
          {/* Events carousel: influencer/distro/source pages worth following, plus
              a few app cards — the influencer half is real now (see /creators/baxyz),
              distro/source links reuse /distros and /sources; a dedicated mixed-content
              carousel is still coming. */}
          <section>
            <h2 class="text-lg font-semibold mb-3">Events &amp; collections</h2>
            <div class="flex flex-wrap gap-3">
              <a href="/creators/baxyz/" class="btn btn-outline">
                baxyz's picks
              </a>
              <a href="/distros/" class="btn btn-outline">
                Browse by source
              </a>
              <a href="/sources/" class="btn btn-outline">
                All sources
              </a>
            </div>
          </section>

          <section>
            <div class="flex items-baseline justify-between mb-1">
              <h2 class="text-lg font-semibold">Trending</h2>
              <a href="/browse/" class="link link-primary text-sm">
                Browse everything →
              </a>
            </div>
            <p class="text-sm text-base-content/60 mb-3">
              Ranked by a popularity score averaged across sources that expose one (AUR usage
              ranking, Flathub's own Popular collection).
            </p>
            {trendingApps.value.length === 0 ? (
              <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
                No trending data available yet.
              </div>
            ) : (
              <HorizontalScroller ariaLabel="Trending apps">
                {trendingApps.value.map((app) => (
                  <AppCardLink key={app.id} app={app} />
                ))}
              </HorizontalScroller>
            )}
          </section>

          <ComingSoonSection
            title="Download trends"
            note="Download/install counts over the past week — depends on a source exposing that signal at all, still being evaluated."
          />

          <ComingSoonSection
            title="Must-have apps"
            note="Staff-curated must-haves are coming soon."
          />

          <ComingSoonSection
            title="Monthly events"
            note="A monthly events feature is still being defined."
          />

          <CategoryRow
            title="Productivity apps"
            category="Productivity"
            apps={productivityApps.value}
          />

          <ComingSoonSection
            title="New games"
            note="No reliable release/added date to sort by yet — showing the same list as Trending games would just be misleading, not actually 'new'."
          />

          <CategoryRow title="Music apps" category="Multimedia" apps={multimediaApps.value} />

          <CategoryRow
            title="Creativity apps"
            category="Graphics & Creativity"
            apps={creativityApps.value}
          />

          <CategoryRow title="Learning apps" category="Education" apps={learningApps.value} />

          <ComingSoonSection
            title="Movies & streaming apps"
            note="Same underlying Multimedia category as Music above — AppStream doesn't split the two, so a genuinely separate list needs its own genre-level taxonomy (not built yet), not a fake duplicate of the Music row."
          />

          <ComingSoonSection
            title="Casual games"
            note="Genre-level game categorization isn't built yet — see the Games page for confirmed games without a genre split."
          />

          <CategoryRow
            title="Social network apps"
            category="Internet & Communication"
            apps={socialApps.value}
          />

          <ComingSoonSection
            title="Puzzle games"
            note="Genre-level game categorization isn't built yet — see the Games page for confirmed games without a genre split."
          />

          <ComingSoonSection
            title="Collections"
            note="Curated, themed collections of apps are still being defined."
          />

          {categories.value.length > 0 && (
            <section>
              <h2 class="text-lg font-semibold mb-3">Browse by category</h2>
              <p class="text-sm text-base-content/60 mb-3">
                Every category, including the ones without a dedicated row above.
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.value.map((c) => (
                  <a
                    key={c.category}
                    href={`/browse/?category=${encodeURIComponent(c.category)}`}
                    aria-label={`Browse ${c.category} (${c.count} apps)`}
                    class="card bg-base-100 border border-base-300 hover:border-primary/40 hover:shadow-md transition-shadow"
                  >
                    <div class="card-body p-4 flex-row items-center justify-between">
                      <span class="font-medium">{c.category}</span>
                      <span class="badge badge-ghost">{c.count.toLocaleString()}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Tuxery — the unified Linux App Store",
  meta: [
    {
      name: "description",
      content:
        "Tuxery aggregates Flatpak, Snap, AppImage and native Linux packages into one unified, deduplicated search engine.",
    },
  ],
};

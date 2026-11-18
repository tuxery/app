import { component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import { CategoryList, StoreList, TopTen } from "~/components/home-aside/home-aside";
import { FeatureCard, FeatureList } from "~/components/home-featured/home-featured";
import { CategoryTileGrid } from "~/components/category-tile-grid/category-tile-grid";
import { HomeHero } from "~/components/home-hero/home-hero";
import {
  BlockPlaceholder,
  Collection,
  CompactGrid,
  Doors,
  ExploreTile,
  FeaturedApp,
  SectionHeader,
  Shelf,
  SpotlightRow,
} from "~/components/home-sections/home-sections";
import { getAppsByIds, getCategories, getStats } from "~/catalog";
import { categoryDirectory } from "~/categories";
import { dailyPick } from "~/daily-pick";
import {
  featureView,
  HOME_FEATURES,
  liveFeatures,
  type CreatorPreview,
} from "~/data/home-features";
import { creatorPicks, getInfluencerPage } from "~/data/influencer-pages";
import { useCatalogUnavailable } from "~/routes/layout";
import { resolveServerEnv } from "~/server-env";
import {
  FAMILY_GAMES,
  HOME_ROWS,
  homeRowsOf,
  interleave,
  mixedCategoryRows,
  MUST_HAVE,
  parseHomeRows,
  type HomeRows,
} from "~/home-rows";

export const useStats = routeLoader$(async (requestEvent) => {
  return getStats(resolveServerEnv(requestEvent.platform));
});

// Apps and games each draw from their own taxonomy (see `tuxery/catalog`'s
// `CatalogApp.category` doc comment). Read for the side column's category
// list, the Explore tiles' counts and the grid that ends the page, and to
// know which category listings the published catalog can fill: two `categoryCounts` meta rows, cached like every listing.
export const useAppCategories = routeLoader$(async (requestEvent) =>
  getCategories(resolveServerEnv(requestEvent.platform), "app"),
);
export const useGameCategories = routeLoader$(async (requestEvent) =>
  getCategories(resolveServerEnv(requestEvent.platform), "game"),
);

// The featured entries live today (`~/data/home-features`), drawn as they
// will be. A creator entry reads the same page data /creators/<slug>/
// renders from, plus a preview of its picks: their count and the first
// few icons (a handful of primary key lookups).
export const useFeatures = routeLoader$(async (requestEvent) => {
  const env = resolveServerEnv(requestEvent.platform);
  return Promise.all(
    liveFeatures(HOME_FEATURES, new Date()).map(async (feature) => {
      if (feature.kind !== "creator") return featureView(feature);
      const page = await getInfluencerPage(feature.slug);
      if (!page) return featureView(feature);
      const picks = creatorPicks(page);
      const apps = await getAppsByIds(env, picks.previewIds);
      const creator: CreatorPreview = {
        slug: page.slug,
        name: page.name,
        tagline: page.tagline,
        count: picks.count,
        icons: picks.previewIds.flatMap((id) => {
          const app = apps.find((candidate) => candidate.id === id);
          return app?.iconUrl ? [{ id, name: app.name, iconUrl: app.iconUrl }] : [];
        }),
      };
      return featureView(feature, creator);
    }),
  );
});

/** How many of the trending games share the app of the day's turn with the must-haves. */
const DAILY_GAMES = 12;
/** The Explore tiles, and the shelves after them, rotating daily through the category rows. */
const EXPLORE_TILES = 9;
const DAILY_SHELVES = 3;

const RECENTLY_UPDATED_TIP =
  "Apps and games in turn, each sorted by the date of its newest release, as its AppStream metadata or its GitHub releases state it.";

export default component$(() => {
  const stats = useStats();
  const appCategories = useAppCategories();
  const gameCategories = useGameCategories();
  const features = useFeatures();
  // The listings come from `/api/home/` in the browser (see
  // `~/home-rows`): `undefined` while they load. Everything picked by the
  // day (the app of the day, the Explore tiles, the shelves) is picked
  // there too, so the edge-cached HTML is the same all day for everyone.
  const rows = useSignal<HomeRows>();
  const generation = stats.value.generatedAt.replaceAll(/\D/g, "");
  useVisibleTask$(async () => {
    try {
      const response = await fetch(`/api/home/?g=${generation}`);
      rows.value = parseHomeRows(response.ok ? await response.json() : {});
    } catch {
      rows.value = parseHomeRows({});
    }
  });
  const catalogUnavailable = useCatalogUnavailable().value;

  const counts = new Map(
    [...appCategories.value, ...gameCategories.value].map(({ category, count }) => [
      category,
      count,
    ]),
  );
  const available = new Set(counts.keys());
  const categoriesOf = (section: "apps" | "games") =>
    homeRowsOf(section, available).flatMap(({ category }) =>
      category ? [{ category, count: counts.get(category) ?? 0 }] : [],
    );
  // Every category, grouped like /categories, for the grid that ends the page.
  const directory = categoryDirectory(appCategories.value, gameCategories.value);
  const [feature, ...otherFeatures] = features.value;
  const family = HOME_ROWS.find((row) => row.listing === FAMILY_GAMES);

  const today = new Date();
  const listing = (name: string) => rows.value?.[name] ?? [];
  const [pick] = dailyPick(
    interleave(listing(MUST_HAVE), listing("trending:game").slice(0, DAILY_GAMES)),
    today,
  );
  const dailyRows = dailyPick(mixedCategoryRows(available), today, EXPLORE_TILES + DAILY_SHELVES);
  const explore = dailyRows.slice(0, EXPLORE_TILES);
  const shelves = dailyRows.slice(EXPLORE_TILES);
  const recent = interleave(listing("newApps:app"), listing("newApps:game")).slice(0, 8);

  return (
    <div class="flex flex-col gap-8">
      <HomeHero total={stats.value.total} />

      {stats.value.total === 0 ? (
        // Unreachable database: the layout's outage banner already says so.
        // Reachable but empty only happens on a fresh local setup — the
        // seeding hint is for developers, never shown in production.
        !catalogUnavailable &&
        import.meta.env.DEV && (
          <p class="text-center text-base-content/70">
            No catalog data loaded — run <code class="font-mono">pnpm seed</code> then{" "}
            <code class="font-mono">pnpm serve</code> in{" "}
            <code class="font-mono">tuxery/catalog</code> first.
          </p>
        )
      ) : (
        // Two columns on wide screens: the feed, and a side column of charts,
        // categories and stores. Below `lg` the side column sits between the
        // feed's first blocks (featured, today, must-haves) and the rest.
        <>
          <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_1fr] items-start">
            <div class="flex flex-col gap-12 min-w-0 lg:col-start-1 lg:row-start-1">
              {feature && (
                <div class="flex flex-col gap-3">
                  <FeatureCard feature={feature} />
                  <div class="lg:hidden">
                    <FeatureList features={otherFeatures} />
                  </div>
                </div>
              )}

              <section>
                <SectionHeader eyebrow="New every day" title="Today on Tuxery" level={2} />
                {rows.value === undefined ? (
                  <BlockPlaceholder class="h-80 sm:h-72" />
                ) : (
                  pick && (
                    <FeaturedApp
                      app={pick}
                      eyebrow={pick.contentType === "game" ? "Game of the day" : "App of the day"}
                    />
                  )
                )}
              </section>

              {(rows.value === undefined || listing(MUST_HAVE).length > 0) && (
                <section>
                  <SectionHeader eyebrow="Start here" title="Must-have apps" level={2} />
                  {rows.value === undefined ? (
                    <BlockPlaceholder class="h-80" />
                  ) : (
                    <SpotlightRow apps={listing(MUST_HAVE)} label="Must-have apps" />
                  )}
                </section>
              )}
            </div>

            <aside
              aria-label="Charts, categories and stores"
              class="flex flex-col gap-6 min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2"
            >
              <div class="hidden lg:block">
                <FeatureList features={otherFeatures} />
              </div>
              {(["apps", "games"] as const).map((section) => {
                const trending = homeRowsOf(section, available).find((row) =>
                  row.listing.startsWith("trending:"),
                );
                return (
                  trending && (
                    <TopTen
                      key={section}
                      title={trending.title}
                      tip={trending.tip}
                      href={trending.href ?? "/browse/"}
                      apps={rows.value?.[trending.listing]}
                    />
                  )
                );
              })}
              <CategoryList apps={categoriesOf("apps")} games={categoriesOf("games")} />
              <StoreList />
            </aside>

            <div class="flex flex-col gap-12 min-w-0 lg:col-start-1 lg:row-start-2">
              {explore.length > 0 && (
                <section>
                  <SectionHeader
                    eyebrow="Different every day"
                    title="Explore"
                    href="/categories/"
                    linkLabel="All categories"
                    level={2}
                  />
                  <div class="grid gap-3 grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-3">
                    {explore.map((row) => (
                      <ExploreTile
                        key={row.listing}
                        title={row.title}
                        category={row.category ?? ""}
                        href={row.href ?? "/categories/"}
                        count={counts.get(row.category ?? "")}
                        unit={row.section === "games" ? "games" : "apps"}
                        apps={rows.value?.[row.listing]}
                      />
                    ))}
                  </div>
                </section>
              )}

              {family && (rows.value === undefined || listing(FAMILY_GAMES).length > 0) && (
                <Collection
                  level={2}
                  eyebrow="All ages"
                  title={family.title}
                  blurb={family.blurb ?? ""}
                  href={family.href}
                >
                  {rows.value === undefined ? (
                    <BlockPlaceholder class="h-56" />
                  ) : (
                    <CompactGrid
                      apps={listing(FAMILY_GAMES).slice(0, 6)}
                      label={family.title}
                      dense
                    />
                  )}
                </Collection>
              )}

              {(rows.value === undefined || recent.length > 0) && (
                <section>
                  <SectionHeader title="Recently updated" tip={RECENTLY_UPDATED_TIP} level={2} />
                  {rows.value === undefined ? (
                    <BlockPlaceholder class="h-64" />
                  ) : (
                    <CompactGrid apps={recent} label="Recently updated" dense />
                  )}
                </section>
              )}

              <Doors apps={rows.value?.["trending:app"]} games={rows.value?.["trending:game"]} />

              {shelves.length > 0 && (
                <section>
                  <SectionHeader eyebrow="Popular in" title="Shelves of the day" level={2} />
                  <div class="grid gap-4 md:grid-cols-3">
                    {shelves.map((row) => (
                      <Shelf
                        key={row.listing}
                        title={row.title}
                        category={row.category}
                        href={row.href}
                        count={counts.get(row.category ?? "")}
                        apps={rows.value?.[row.listing]?.slice(0, 4)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          {directory.length > 0 && (
            <section aria-label="Browse by category" class="flex flex-col gap-4">
              <SectionHeader
                title="Browse by category"
                href="/categories/"
                linkLabel="All categories"
                level={2}
              />
              {directory.map(({ group, items }) => (
                <div key={group.id}>
                  <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70 mb-2">
                    {group.title}
                  </h3>
                  <CategoryTileGrid categories={items} />
                </div>
              ))}
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

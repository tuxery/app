import { component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import {
  LuChevronLeft,
  LuChevronRight,
  LuInfo,
  LuMegaphone,
  LuSearch,
} from "@qwikest/icons/lucide";
import { AppCardLink } from "~/components/app-card/app-card";
import { CategoryIcon } from "~/components/category-icon/category-icon";
import { CategoryTileGrid } from "~/components/category-tile-grid/category-tile-grid";
import { HorizontalScroller } from "~/components/horizontal-scroller/horizontal-scroller";
import { Logo } from "~/components/logo/logo";
import { getAppsByIds, getCategories, getStats, type CategoryCount } from "~/catalog";
import { categoryDirectory } from "~/categories";
import { creatorPicks, getInfluencerPage } from "~/data/influencer-pages";
import { SOURCE_LOGOS } from "~/data/logos";
import { useCatalogUnavailable } from "~/routes/layout";
import { SEARCH_MIN_WORD_LENGTH } from "~/search-fts";
import { resolveServerEnv } from "~/server-env";
import type { AppSummary } from "~/catalog-types";
import { HOME_SECTIONS, homeRowsOf, parseHomeRows, type HomeRow, type HomeRows } from "~/home-rows";

export const useStats = routeLoader$(async (requestEvent) => {
  return getStats(resolveServerEnv(requestEvent.platform));
});

// Apps and games each draw from their own taxonomy (see `tuxery/catalog`'s
// `CatalogApp.category` doc comment). Read for the category chips and grid,
// and to know which category rows the published catalog can fill: two
// `categoryCounts` meta rows, cached like every listing.
export const useAppCategories = routeLoader$(async (requestEvent) =>
  getCategories(resolveServerEnv(requestEvent.platform), "app"),
);
export const useGameCategories = routeLoader$(async (requestEvent) =>
  getCategories(resolveServerEnv(requestEvent.platform), "game"),
);

// Reuses the same influencer-page data /creators/baxyz/ itself renders
// from, so the homepage slide's name/avatar stay in sync with that page
// rather than duplicating them as separate hardcoded homepage copy. Adds a
// preview of the picks (their count and the first few icons, four primary
// key lookups): the slide used to be a name on a gradient, which said
// nothing about what is behind it.
export const useFeaturedCreator = routeLoader$(async (requestEvent) => {
  const page = await getInfluencerPage("baxyz");
  if (!page) return undefined;
  const picks = creatorPicks(page);
  const apps = await getAppsByIds(resolveServerEnv(requestEvent.platform), picks.previewIds);
  return {
    name: page.name,
    slug: page.slug,
    avatarUrl: page.avatarUrl,
    tagline: page.tagline,
    count: picks.count,
    groups: picks.groups,
    icons: picks.previewIds.flatMap((id) => {
      const app = apps.find((candidate) => candidate.id === id);
      return app?.iconUrl ? [{ id, name: app.name, iconUrl: app.iconUrl }] : [];
    }),
  };
});

/**
 * A row's place while its cards load (see `~/home-rows`): the height of a
 * row of cards, so the page doesn't jump when they arrive.
 */
const RowPlaceholder = () => (
  <div
    class="h-56 rounded-box bg-base-200/60 animate-pulse"
    aria-busy="true"
    aria-label="Loading"
  />
);

/**
 * One row of cards (see `HOME_ROWS`): its title, the sort explained on an
 * info icon when it isn't obvious, a link to the full listing, and the
 * cards in a horizontal scroller. `apps` is undefined while the rows load.
 * An empty listing is left out, unless the row has a message to say why
 * it's empty (the dataset-wide rows: trending, recently updated).
 */
const HomeRowView = component$<{ row: HomeRow; apps?: AppSummary[] }>(({ row, apps }) =>
  apps?.length === 0 && row.emptyMessage === undefined ? null : (
    <section>
      <div class="flex items-baseline justify-between gap-3 mb-3">
        <div class="flex items-center gap-1.5 min-w-0">
          <h3 class="text-lg font-semibold">{row.title}</h3>
          {row.tip && (
            <div class="tooltip tooltip-right" data-tip={row.tip}>
              <LuInfo class="text-sm text-base-content/70 cursor-help" aria-label={row.tip} />
            </div>
          )}
        </div>
        {row.href && (
          <a href={row.href} class="link link-primary text-sm shrink-0">
            {row.category ? "Browse all →" : "Browse everything →"}
          </a>
        )}
      </div>
      {apps === undefined ? (
        <RowPlaceholder />
      ) : apps.length === 0 ? (
        <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/70">
          {row.emptyMessage}
        </div>
      ) : (
        <HorizontalScroller ariaLabel={row.title}>
          {apps.map((app) => (
            <AppCardLink key={app.id} app={app} linkClass="block w-64 shrink-0 snap-start" />
          ))}
        </HorizontalScroller>
      )}
    </section>
  ),
);

/**
 * The way in by category, right under the search: one scrolling line of
 * chips for the app categories (in /categories' group order) and one for
 * the game genres, each a /browse filter. The full grid with counts is at
 * the bottom of the page.
 */
const CategoryChips = component$<{
  lines: { label: string; categories: CategoryCount[] }[];
}>(({ lines }) => (
  <section aria-labelledby="home-categories" class="flex flex-col gap-2">
    <div class="flex items-baseline justify-between">
      <h2 id="home-categories" class="text-lg font-semibold">
        Categories
      </h2>
      <a href="/categories/" class="link link-primary text-sm">
        All categories →
      </a>
    </div>
    {lines.map((line) => (
      // The gap leaves room for the scroller's left arrow, which straddles its edge.
      <div key={line.label} class="flex items-center gap-3 sm:gap-6">
        <span class="w-14 shrink-0 text-xs font-semibold text-base-content/70 uppercase tracking-wide">
          {line.label}
        </span>
        <div class="min-w-0 flex-1">
          <HorizontalScroller ariaLabel={`${line.label} categories`} compact>
            {line.categories.map(({ category }) => (
              <a
                key={category}
                href={`/browse/?category=${encodeURIComponent(category)}`}
                class="btn btn-sm rounded-full font-normal shrink-0 snap-start"
              >
                <CategoryIcon category={category} class="text-primary" />
                {category}
              </a>
            ))}
          </HorizontalScroller>
        </div>
      </div>
    ))}
  </section>
));

// Placeholder tiles: a color gradient + the store's logo per destination, not a real
// photo — no external image dependency (no Unsplash-quota cost, no
// per-image attribution to display on a small tile). Swap `gradient` for
// a real `imageUrl` later without changing the grid around it. Each links
// to that source's own dedicated page (`/sources/[id]/`), not straight to
// the external store — the dedicated page is what has the external
// "Visit ___" link, plus a trending recap first.
const DESTINATION_TILES = [
  {
    title: "Flathub",
    href: "/sources/flatpak-flathub/",
    source: "flatpak-flathub",
    gradient: "from-sky-500 to-blue-700",
  },
  {
    title: "Snap Store",
    href: "/sources/snap-snapcraft/",
    source: "snap-snapcraft",
    gradient: "from-orange-500 to-red-600",
  },
  // GOG's tile is hidden while its fetch is paused (its User Agreement forbids
  // extraction tools; tuxery/catalog#139): no new GOG games come in until GOG
  // answers. Its store page stays reachable from /docs/sources/. To restore:
  // { title: "GOG", href: "/sources/gog/", source: "gog", gradient: "from-violet-600 to-indigo-700" },
  {
    title: "Lutris",
    href: "/sources/lutris/",
    source: "lutris",
    gradient: "from-amber-500 to-rose-600",
  },
] as const;

/**
 * The left 2/3 of "Events & collections": a single-card-at-a-time slider,
 * same scroll-snap-row + circle-button pattern as `HorizontalScroller`
 * (not reused directly — its children peek at a fixed width, this needs
 * exactly one full-width slide visible at a time). Not daisyUI's `stack`:
 * `stack` overlays elements in place for a static deck look, it doesn't
 * scroll, so it's the wrong tool for "one card visible, scroll to the
 * next one." Two slides: the featured creator's pick, then a
 * call-to-action pointing at the still-TODO "influencer mode" roadmap
 * item (see /creators/).
 */
const InfluencerSlider = component$<{
  creator:
    | {
        name: string;
        slug: string;
        avatarUrl?: string;
        tagline: string;
        count: number;
        groups: number;
        icons: { id: string; name: string; iconUrl: string }[];
      }
    | undefined;
}>(({ creator }) => {
  const trackRef = useSignal<HTMLElement>();

  return (
    <div class="relative w-full h-full">
      <div
        ref={trackRef}
        aria-label="Featured creators"
        class="flex w-full h-full overflow-x-auto scroll-smooth snap-x snap-mandatory rounded-box"
      >
        <a
          href={creator ? `/creators/${creator.slug}/` : "/creators/"}
          aria-label={creator ? `${creator.name}'s picks` : "Creator picks"}
          class="w-full h-full shrink-0 snap-start flex flex-col items-center justify-center text-center gap-3 p-6 bg-gradient-to-br from-primary to-secondary text-primary-content"
        >
          <div class="avatar avatar-placeholder">
            <div class="w-16 rounded-full bg-base-100 text-base-content">
              {creator?.avatarUrl ? (
                <img src={creator.avatarUrl} alt="" width={64} height={64} />
              ) : (
                <span class="text-xl">{creator?.name.charAt(0).toUpperCase() ?? "?"}</span>
              )}
            </div>
          </div>
          <p class="text-sm opacity-80">Picked by</p>
          <p class="text-2xl font-bold">{creator?.name ?? "our creators"}</p>
          {creator && (
            <>
              <p class="text-sm opacity-90 max-w-md line-clamp-2">{creator.tagline}</p>
              {creator.icons.length > 0 && (
                <ul class="flex -space-x-2" aria-hidden="true">
                  {creator.icons.map((icon) => (
                    <li key={icon.id}>
                      <img
                        src={icon.iconUrl}
                        alt=""
                        width={36}
                        height={36}
                        loading="lazy"
                        class="size-9 rounded-field bg-base-100 p-1 object-contain ring-2 ring-primary"
                      />
                    </li>
                  ))}
                </ul>
              )}
              <span class="text-sm underline underline-offset-2">
                {creator.count} apps in {creator.groups} categories →
              </span>
            </>
          )}
        </a>
        <a
          href="/creators/"
          aria-label="Want to share your apps? Click here"
          class="w-full h-full shrink-0 snap-start flex flex-col items-center justify-center text-center gap-3 p-6 bg-gradient-to-br from-secondary to-accent text-secondary-content"
        >
          <LuMegaphone class="text-3xl opacity-90" />
          <p class="text-lg font-semibold">Want to share your apps?</p>
          <span class="text-sm underline underline-offset-2">Click here →</span>
        </a>
      </div>

      {/* Same left/right circle-button pattern as HorizontalScroller — a
          plain scroll-snap row gives no visual hint it's scrollable at
          all, especially with a mouse (no drag affordance, no arrows). */}
      <button
        type="button"
        class="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2 shadow-md"
        aria-label="Previous slide"
        onClick$={() =>
          trackRef.value?.scrollBy({ left: -trackRef.value.clientWidth, behavior: "smooth" })
        }
      >
        <LuChevronLeft />
      </button>
      <button
        type="button"
        class="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 shadow-md"
        aria-label="Next slide"
        onClick$={() =>
          trackRef.value?.scrollBy({ left: trackRef.value.clientWidth, behavior: "smooth" })
        }
      >
        <LuChevronRight />
      </button>
    </div>
  );
});

export default component$(() => {
  const stats = useStats();
  const appCategories = useAppCategories();
  const gameCategories = useGameCategories();
  const featuredCreator = useFeaturedCreator();
  // The rows of cards come from `/api/home/` in the browser (see
  // `~/home-rows`): `undefined` while they load, then each row's cards.
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
  // Which category rows the published catalog can fill, and what the
  // chips and the bottom grid list.
  const available = new Set(
    [...appCategories.value, ...gameCategories.value].map(({ category }) => category),
  );
  const directory = categoryDirectory(appCategories.value, gameCategories.value);
  const chipLines = [
    {
      label: "Apps",
      categories: directory
        .filter(({ group }) => group.id !== "games")
        .flatMap(({ items }) => items),
    },
    {
      label: "Games",
      categories: directory.find(({ group }) => group.id === "games")?.items ?? [],
    },
  ].filter(({ categories }) => categories.length > 0);

  return (
    <div class="flex flex-col gap-14">
      <section class="hero rounded-box px-4 md:px-6">
        <div class="hero-content text-center py-14">
          <div class="max-w-2xl">
            <h1 class="text-4xl md:text-5xl font-bold md:text-nowrap">
              Search <span class="text-primary">every</span> Linux app.
            </h1>
            <p class="py-4 text-base-content/70">
              Tuxery aggregates Flathub, the Snap Store, AppImage, and every distro's own repos into
              one catalog — search once, install from wherever it's shipped.
            </p>
            <form action="/browse" method="get" class="flex justify-center">
              <label class="input input-lg w-full max-w-md flex items-center gap-2">
                <LuSearch class="text-base-content/70" />
                <input
                  type="search"
                  name="q"
                  minLength={SEARCH_MIN_WORD_LENGTH}
                  placeholder="Search for an app or game…"
                  aria-label="Search for an app"
                  class="grow"
                />
              </label>
            </form>
            {stats.value.total > 0 && (
              <p class="text-sm mt-4 text-base-content/70">
                {stats.value.total.toLocaleString()} apps and games catalogued
              </p>
            )}
          </div>
        </div>
      </section>

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
        <>
          {chipLines.length > 0 && <CategoryChips lines={chipLines} />}

          {/* Events & collections: a featured-creator slider (left, 2/3) next
              to four store destination tiles (right, 2x2) — capped to
              roughly three classic app-card heights so it doesn't
              dominate the page above Trending. */}
          <section>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 h-auto lg:h-96">
              <div class="lg:col-span-2 h-64 lg:h-full">
                <InfluencerSlider creator={featuredCreator.value} />
              </div>
              <div class="grid grid-cols-2 grid-rows-2 gap-3 h-64 lg:h-full">
                {DESTINATION_TILES.map((tile, i) => (
                  <a
                    key={tile.title}
                    href={tile.href}
                    aria-label={tile.title}
                    class={[
                      `card bg-gradient-to-br ${tile.gradient} text-white justify-center hover:brightness-110 transition-[filter]`,
                      // An odd last tile spans the row, so the 2x2 grid has no hole.
                      DESTINATION_TILES.length % 2 === 1 &&
                        i === DESTINATION_TILES.length - 1 &&
                        "col-span-2",
                    ]}
                  >
                    <div class="card-body items-center justify-center text-center p-3 gap-1">
                      <Logo slug={SOURCE_LOGOS[tile.source]} class="w-9 h-9" />
                      <span class="font-semibold text-sm">{tile.title}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {HOME_SECTIONS.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`home-${section.id}`}
              class="flex flex-col gap-10"
            >
              <div class="flex items-baseline justify-between border-b border-base-300 pb-2">
                <h2 id={`home-${section.id}`} class="text-2xl font-bold">
                  {section.title}
                </h2>
                <a href={section.href} class="link link-primary text-sm">
                  {section.linkLabel} →
                </a>
              </div>
              {homeRowsOf(section.id, available).map((row) => (
                <HomeRowView key={row.listing} row={row} apps={rows.value?.[row.listing]} />
              ))}
            </section>
          ))}

          {directory.length > 0 && (
            <section aria-labelledby="home-browse-categories">
              <div class="flex items-baseline justify-between mb-3">
                <h2 id="home-browse-categories" class="text-lg font-semibold">
                  Browse by category
                </h2>
                <a href="/categories/" class="link link-primary text-sm">
                  All categories →
                </a>
              </div>
              <div class="flex flex-col gap-4">
                {directory.map(({ group, items }) => (
                  <div key={group.id}>
                    <h3 class="text-xs font-semibold text-base-content/70 uppercase tracking-wide mb-2">
                      {group.title}
                    </h3>
                    <CategoryTileGrid categories={items} />
                  </div>
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

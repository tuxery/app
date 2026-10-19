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
import { CategoryTileGrid } from "~/components/category-tile-grid/category-tile-grid";
import { HorizontalScroller } from "~/components/horizontal-scroller/horizontal-scroller";
import { Logo } from "~/components/logo/logo";
import { getCategories, getStats } from "~/catalog";
import { getInfluencerPage } from "~/data/influencer-pages";
import { SOURCE_LOGOS } from "~/data/logos";
import { useCatalogUnavailable } from "~/routes/layout";
import { resolveServerEnv } from "~/server-env";
import type { AppSummary } from "~/catalog-types";
import { parseHomeRows, type HomeRows } from "~/home-rows";

export const useStats = routeLoader$(async (requestEvent) => {
  return getStats(resolveServerEnv(requestEvent.platform));
});

// "Browse by category" is split Apps/Games — each draws from its own
// taxonomy now (see `tuxery/catalog`'s `CatalogApp.category` doc comment).
export const useAppCategories = routeLoader$(async (requestEvent) =>
  getCategories(resolveServerEnv(requestEvent.platform), "app"),
);
export const useGameCategories = routeLoader$(async (requestEvent) =>
  getCategories(resolveServerEnv(requestEvent.platform), "game"),
);

// Reuses the same influencer-page data /creators/baxyz/ itself renders
// from, so the homepage slide's name/avatar stay in sync with that page
// rather than duplicating them as separate hardcoded homepage copy.
export const useFeaturedCreator = routeLoader$(async () => getInfluencerPage("baxyz"));

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

/** A curated-by-category row (Productivity, Creativity, ...) — real data, not a placeholder, but honest about showing nothing when a category happens to be empty rather than hiding the whole section. */
const CategoryRow = component$<{ title: string; category: string; apps?: AppSummary[] }>(
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
      {apps === undefined ? (
        <RowPlaceholder />
      ) : apps.length === 0 ? (
        <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/70">
          No {title.toLowerCase()} catalogued yet.
        </div>
      ) : (
        <HorizontalScroller ariaLabel={title}>
          {apps.map((app) => (
            <AppCardLink key={app.id} app={app} linkClass="block w-64 shrink-0 snap-start" />
          ))}
        </HorizontalScroller>
      )}
    </section>
  ),
);

const TRENDING_TIP =
  "Ranked by a popularity score averaged across sources that expose one (AUR usage ranking, Flathub's own Popular collection).";
const NEW_GAMES_TIP =
  "Sorted by each source's own newest-release date (Flathub/AppCenter's AppStream <releases> timestamp) — not every app has one, so this skews toward Flatpak-packaged games.";
const DOWNLOAD_TRENDS_TIP =
  "Ranked by installs over the last 7 days (Flathub's own per-app stats API) — not lifetime total, so this reflects what's popular right now rather than old, long-established apps. Flathub only today, so this skews toward Flatpak-packaged apps.";

/**
 * One horizontal app row (Trending apps/games, New games, Download
 * trends, ...), optionally scoped to one content type — used to be a
 * single "TrendingRow" hardcoded to the trending methodology tooltip;
 * generalized once "New games"/"Download trends" needed the same shell
 * with different copy (a release-date/install-count explanation, not a
 * popularity one) rather than duplicating the whole scroller structure.
 * `typeFilter: "all"` (Download trends — both apps and games trend on
 * downloads) still links to a real, working `/browse/?type=all`, the
 * same as picking "All" in Browse's own type dropdown.
 */
const AppScrollRow = component$<{
  title: string;
  typeFilter: "all" | "app" | "game";
  apps?: AppSummary[];
  tip: string;
  emptyMessage: string;
}>(({ title, typeFilter, apps, tip, emptyMessage }) => (
  <section>
    <div class="flex items-baseline justify-between mb-3">
      <div class="flex items-center gap-1.5">
        <h2 class="text-lg font-semibold">{title}</h2>
        <div class="tooltip tooltip-right" data-tip={tip}>
          <LuInfo class="text-sm text-base-content/70 cursor-help" aria-label={tip} />
        </div>
      </div>
      <a href={`/browse/?type=${typeFilter}`} class="link link-primary text-sm">
        Browse everything →
      </a>
    </div>
    {apps === undefined ? (
      <RowPlaceholder />
    ) : apps.length === 0 ? (
      <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/70">
        {emptyMessage}
      </div>
    ) : (
      <HorizontalScroller ariaLabel={title}>
        {apps.map((app) => (
          <AppCardLink key={app.id} app={app} linkClass="block w-64 shrink-0 snap-start" />
        ))}
      </HorizontalScroller>
    )}
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
  {
    title: "GOG",
    href: "/sources/gog/",
    source: "gog",
    gradient: "from-violet-600 to-indigo-700",
  },
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
  creator: { name: string; slug: string; avatarUrl?: string } | undefined;
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
                <img src={creator.avatarUrl} alt="" />
              ) : (
                <span class="text-xl">{creator?.name.charAt(0).toUpperCase() ?? "?"}</span>
              )}
            </div>
          </div>
          <p class="text-sm opacity-80">La sélection de</p>
          <p class="text-2xl font-bold">{creator?.name ?? "our creators"}</p>
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

const ComingSoonSection = component$<{ title: string; note: string }>(({ title, note }) => (
  <section>
    <h2 class="text-lg font-semibold mb-2">{title}</h2>
    <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/70">
      {note}
    </div>
  </section>
));

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
          {/* Events & collections: a featured-creator slider (left, 2/3) next
              to four store destination tiles (right, 2x2) — capped to
              roughly three classic app-card heights so it doesn't
              dominate the page above Trending. */}
          <section>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 h-auto lg:h-96">
              <div class="lg:col-span-2 h-64 lg:h-full">
                <InfluencerSlider
                  creator={
                    featuredCreator.value
                      ? {
                          name: featuredCreator.value.name,
                          slug: featuredCreator.value.slug,
                          avatarUrl: featuredCreator.value.avatarUrl,
                        }
                      : undefined
                  }
                />
              </div>
              <div class="grid grid-cols-2 grid-rows-2 gap-3 h-64 lg:h-full">
                {DESTINATION_TILES.map((tile) => (
                  <a
                    key={tile.title}
                    href={tile.href}
                    aria-label={tile.title}
                    class={`card bg-gradient-to-br ${tile.gradient} text-white justify-center hover:brightness-110 transition-[filter]`}
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

          <AppScrollRow
            title="Trending apps"
            typeFilter="app"
            apps={rows.value?.trendingApps}
            tip={TRENDING_TIP}
            emptyMessage="No trending data available yet."
          />
          <AppScrollRow
            title="Trending games"
            typeFilter="game"
            apps={rows.value?.trendingGames}
            tip={TRENDING_TIP}
            emptyMessage="No trending data available yet."
          />

          <AppScrollRow
            title="Download trends"
            typeFilter="all"
            apps={rows.value?.downloadTrends}
            tip={DOWNLOAD_TRENDS_TIP}
            emptyMessage="No download-stats data available yet."
          />

          <section>
            <h2 class="text-lg font-semibold mb-3">Must-have apps</h2>
            {rows.value === undefined ? (
              <RowPlaceholder />
            ) : rows.value.mustHave.length === 0 ? (
              <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/70">
                No must-have apps catalogued yet.
              </div>
            ) : (
              <HorizontalScroller ariaLabel="Must-have apps">
                {rows.value.mustHave.map((app) => (
                  <AppCardLink key={app.id} app={app} linkClass="block w-64 shrink-0 snap-start" />
                ))}
              </HorizontalScroller>
            )}
          </section>

          <CategoryRow
            title="Productivity apps"
            category="Productivity"
            apps={rows.value?.productivity}
          />

          {/* See the "Split Internet & Communication" board card. */}
          <ComingSoonSection
            title="Messaging"
            note="Not its own category yet — chat/messaging apps are folded into the broader Internet & Communication bucket, with no way to isolate just messaging."
          />

          <AppScrollRow
            title="New games"
            typeFilter="game"
            apps={rows.value?.newGames}
            tip={NEW_GAMES_TIP}
            emptyMessage="No release-date data available yet."
          />

          <CategoryRow title="Music apps" category="Music & Audio" apps={rows.value?.music} />

          <CategoryRow
            title="Graphics & design apps"
            category="Graphics & Design"
            apps={rows.value?.creativity}
          />

          {/* See the "Add a Kids/Children category" board card. */}
          <ComingSoonSection
            title="For kids"
            note="Not part of the current category taxonomy — no data to show yet."
          />

          <CategoryRow title="Learning apps" category="Education" apps={rows.value?.learning} />

          <CategoryRow
            title="Movies & streaming apps"
            category="Photo & Video"
            apps={rows.value?.video}
          />

          <CategoryRow title="Casual games" category="Casual" apps={rows.value?.casualGames} />

          {/* See the "Split Internet & Communication" board card — same
              dependency as Messaging above. Was previously a real
              CategoryRow scoped to "Internet & Communication", but that
              category is browsers/email/VoIP/social all mixed together —
              mislabeling that mix as "social network" specifically was
              the actual bug, not the coming-soon treatment. */}
          <ComingSoonSection
            title="Social network apps"
            note="Not its own category yet — social apps are folded into the broader Internet & Communication bucket alongside browsers, email, and VoIP, with no way to isolate just social networks."
          />

          <CategoryRow title="Puzzle games" category="Puzzle" apps={rows.value?.puzzleGames} />

          {(appCategories.value.length > 0 || gameCategories.value.length > 0) && (
            <section>
              <h2 class="text-lg font-semibold mb-3">Browse by category</h2>
              <p class="text-sm text-base-content/70 mb-3">
                Every category, including the ones without a dedicated row above — apps and games
                each draw from their own taxonomy, same split Trending uses.
              </p>

              <div class="flex flex-col gap-4">
                {appCategories.value.length > 0 && (
                  <div>
                    <h3 class="text-xs font-semibold text-base-content/70 uppercase tracking-wide mb-2">
                      Apps
                    </h3>
                    <CategoryTileGrid categories={appCategories.value} />
                  </div>
                )}

                {gameCategories.value.length > 0 && (
                  <div>
                    <h3 class="text-xs font-semibold text-base-content/70 uppercase tracking-wide mb-2">
                      Games
                    </h3>
                    <CategoryTileGrid categories={gameCategories.value} />
                  </div>
                )}
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

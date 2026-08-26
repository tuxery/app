import { component$, useSignal } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  LuChevronLeft,
  LuChevronRight,
  LuGamepad2,
  LuInfo,
  LuJoystick,
  LuLayoutGrid,
  LuMegaphone,
  LuSearch,
  LuWrench,
} from "@qwikest/icons/lucide";
import { AppCard } from "~/components/app-card/app-card";
import { HorizontalScroller } from "~/components/horizontal-scroller/horizontal-scroller";
import {
  getStats,
  getTrendingApps,
  getCategories,
  getAppsByCategory,
  getAppsByIds,
  type CategoryCount,
} from "~/catalog";
import { getInfluencerPage } from "~/data/influencer-pages";
import { useHeroBackground } from "~/routes/layout";
import type { AppSummary } from "~/catalog-types";

export const useStats = routeLoader$(async () => {
  return getStats();
});

// One row per content type, not one mixed "Trending" row — each links to
// its own /browse/?type=... scope (same convention /games/'s own
// "Trending games" row already uses).
export const useTrendingApps = routeLoader$(async () => getTrendingApps("app"));
export const useTrendingGames = routeLoader$(async () => getTrendingApps("game"));
export const useTrendingUtils = routeLoader$(async () => getTrendingApps("utility"));

// "Browse by category" is split Apps/Utils the same way trending is — no
// "game" variant, see `getCategories`'s own doc comment for why.
export const useAppCategories = routeLoader$(async () => getCategories("app"));
export const useUtilCategories = routeLoader$(async () => getCategories("utility"));

// Reuses the same influencer-page data /creators/baxyz/ itself renders
// from, so the homepage slide's name/avatar stay in sync with that page
// rather than duplicating them as separate hardcoded homepage copy.
export const useFeaturedCreator = routeLoader$(async () => getInfluencerPage("baxyz"));

// One loader per curated row on the "Homepage: full section layout" board
// card — Qwik City loaders have to be individually exported consts, not
// built from a loop. Category strings match enrich/category.ts's
// CATEGORY_LABELS on the catalog side exactly (kept in sync by hand, same
// convention as catalog-types.ts's own mirrors). No "Internet &
// Communication" row (former "Social network apps") — see MUST_HAVE_APP_IDS'
// neighbor comment on why that one's gone.
export const useProductivityApps = routeLoader$(async () => getAppsByCategory("Productivity"));
export const useCreativityApps = routeLoader$(async () =>
  getAppsByCategory("Graphics & Creativity"),
);
export const useLearningApps = routeLoader$(async () => getAppsByCategory("Education"));
export const useMultimediaApps = routeLoader$(async () => getAppsByCategory("Multimedia"));

// Hand-picked, not category-derived — there's no "must-have" signal in the
// data model, so this is genuinely editorial, same spirit as
// influencer-pages.json. Real catalog ids, each verified live against the
// seeded DB before being added here — capped at 15 per the "max 15 items"
// ask. Order is the display order (getAppsByIds doesn't preserve input
// order, so the loader below re-sorts by it).
const MUST_HAVE_APP_IDS = [
  "flatpak-flathub:org.mozilla.firefox",
  "flatpak-flathub:app.zen_browser.zen",
  "flatpak-flathub:org.videolan.VLC",
  "flatpak-flathub:org.libreoffice.LibreOffice",
  "flatpak-flathub:org.mozilla.thunderbird",
  "flatpak-flathub:com.discordapp.Discord",
  "flatpak-flathub:org.signal.Signal",
  "flatpak-flathub:org.gimp.GIMP",
  "flatpak-flathub:org.inkscape.Inkscape",
  "flatpak-flathub:org.kde.krita",
  "flatpak-flathub:org.blender.Blender",
  "flatpak-flathub:org.kde.kdenlive.desktop",
  "flatpak-flathub:org.audacityteam.Audacity",
  "flatpak-flathub:com.obsproject.Studio",
  "flatpak-flathub:org.keepassxc.KeePassXC.desktop",
] as const;

export const useMustHaveApps = routeLoader$(async () => {
  const apps = await getAppsByIds([...MUST_HAVE_APP_IDS]);
  const byId = new Map(apps.map((app) => [app.id, app]));
  return MUST_HAVE_APP_IDS.map((id) => byId.get(id)).filter((app): app is AppSummary => !!app);
});

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

const TRENDING_TIP =
  "Ranked by a popularity score averaged across sources that expose one (AUR usage ranking, Flathub's own Popular collection).";

/**
 * One content-type-scoped trending row (Apps/Games/Utils) — used to be a
 * single mixed "Trending" row with its ranking-methodology explanation as
 * a full paragraph underneath; now an "i" tooltip next to the heading
 * instead, so three of these stacked don't repeat the same paragraph
 * three times.
 */
const TrendingRow = component$<{
  title: string;
  typeFilter: "app" | "game" | "utility";
  apps: AppSummary[];
}>(({ title, typeFilter, apps }) => (
  <section>
    <div class="flex items-baseline justify-between mb-3">
      <div class="flex items-center gap-1.5">
        <h2 class="text-lg font-semibold">{title}</h2>
        <div class="tooltip tooltip-right" data-tip={TRENDING_TIP}>
          <LuInfo class="text-sm text-base-content/40 cursor-help" aria-label={TRENDING_TIP} />
        </div>
      </div>
      <a href={`/browse/?type=${typeFilter}`} class="link link-primary text-sm">
        Browse everything →
      </a>
    </div>
    {apps.length === 0 ? (
      <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
        No trending data available yet.
      </div>
    ) : (
      <HorizontalScroller ariaLabel={title}>
        {apps.map((app) => (
          <AppCardLink key={app.id} app={app} />
        ))}
      </HorizontalScroller>
    )}
  </section>
));

// Placeholder tiles: a color gradient + icon per destination, not a real
// photo — no external image dependency (no Unsplash-quota cost, no
// per-image attribution to display on a small tile). Swap `gradient` for
// a real `imageUrl` later without changing the grid around it.
const DESTINATION_TILES = [
  {
    title: "All games",
    href: "/games/",
    icon: LuGamepad2,
    gradient: "from-violet-600 to-indigo-700",
  },
  {
    title: "Lutris",
    href: "/browse/?source=lutris",
    icon: LuJoystick,
    gradient: "from-amber-500 to-rose-600",
  },
  {
    title: "All apps",
    href: "/apps/",
    icon: LuLayoutGrid,
    gradient: "from-sky-500 to-blue-700",
  },
  {
    title: "All utils",
    href: "/utils/",
    icon: LuWrench,
    gradient: "from-emerald-500 to-teal-700",
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
    <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
      {note}
    </div>
  </section>
));

/** One Apps-or-Utils tile grid within "Browse by category" — extracted so the Games slot next to it can show its own no-data note instead of a second empty grid. */
const CategoryTileGrid = component$<{ categories: CategoryCount[] }>(({ categories }) =>
  categories.length === 0 ? (
    <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
      No categories catalogued yet.
    </div>
  ) : (
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {categories.map((c) => (
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
  ),
);

export default component$(() => {
  const stats = useStats();
  const trendingApps = useTrendingApps();
  const trendingGames = useTrendingGames();
  const trendingUtils = useTrendingUtils();
  const appCategories = useAppCategories();
  const utilCategories = useUtilCategories();
  const featuredCreator = useFeaturedCreator();
  const heroBackground = useHeroBackground();
  const bg = heroBackground.value;
  const productivityApps = useProductivityApps();
  const creativityApps = useCreativityApps();
  const learningApps = useLearningApps();
  const multimediaApps = useMultimediaApps();
  const mustHaveApps = useMustHaveApps();

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
          {/* Events & collections: a featured-creator slider (left, 2/3) next
              to four destination tiles (right, 2x2) — capped to roughly
              three classic app-card heights so it doesn't dominate the
              page above Trending. */}
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
                      <tile.icon class="text-2xl opacity-90" />
                      <span class="font-semibold text-sm">{tile.title}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>

          <TrendingRow title="Trending apps" typeFilter="app" apps={trendingApps.value} />
          <TrendingRow title="Trending games" typeFilter="game" apps={trendingGames.value} />
          <TrendingRow title="Trending utils" typeFilter="utility" apps={trendingUtils.value} />

          {/* Flathub's own per-app stats API (installs_total + a daily
              installs_per_day series) was verified live and would cover
              this — see the "Flathub download-stats connector" board card.
              Not wired up yet: needs a new fetch step in the catalog
              pipeline, not just an app-side change. */}
          <ComingSoonSection
            title="Download trends"
            note="Download/install counts over the past week — Flathub exposes a real per-app stats API for this (verified), just not fetched into the catalog yet."
          />

          <section>
            <h2 class="text-lg font-semibold mb-3">Must-have apps</h2>
            {mustHaveApps.value.length === 0 ? (
              <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
                No must-have apps catalogued yet.
              </div>
            ) : (
              <HorizontalScroller ariaLabel="Must-have apps">
                {mustHaveApps.value.map((app) => (
                  <AppCardLink key={app.id} app={app} />
                ))}
              </HorizontalScroller>
            )}
          </section>

          <CategoryRow
            title="Productivity apps"
            category="Productivity"
            apps={productivityApps.value}
          />

          {/* See the "Split Internet & Communication" board card. */}
          <ComingSoonSection
            title="Messaging"
            note="Not its own category yet — chat/messaging apps are folded into the broader Internet & Communication bucket, with no way to isolate just messaging."
          />

          {/* See the "Release/added-date signal for apps" board card. */}
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

          {/* See the "Add a Kids/Children category" board card. */}
          <ComingSoonSection
            title="For kids"
            note="Not part of the current category taxonomy (freedesktop.org's Main Categories don't cover it) — no data to show yet."
          />

          <CategoryRow title="Learning apps" category="Education" apps={learningApps.value} />

          {/* See the "Genre-level game taxonomy" board card — same
              dependency as Casual/Puzzle games below. */}
          <ComingSoonSection
            title="Movies & streaming apps"
            note="Same underlying Multimedia category as Music above — AppStream doesn't split the two, so a genuinely separate list needs its own genre-level taxonomy (not built yet), not a fake duplicate of the Music row."
          />

          <ComingSoonSection
            title="Casual games"
            note="Genre-level game categorization isn't built yet — see the Games page for confirmed games without a genre split."
          />

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

          <ComingSoonSection
            title="Puzzle games"
            note="Genre-level game categorization isn't built yet — see the Games page for confirmed games without a genre split."
          />

          {(appCategories.value.length > 0 || utilCategories.value.length > 0) && (
            <section>
              <h2 class="text-lg font-semibold mb-3">Browse by category</h2>
              <p class="text-sm text-base-content/60 mb-3">
                Every category, including the ones without a dedicated row above — split the same
                way Trending is, Apps/Games/Utils.
              </p>

              <div class="flex flex-col gap-4">
                <div>
                  <h3 class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">
                    Apps
                  </h3>
                  <CategoryTileGrid categories={appCategories.value} />
                </div>

                <div>
                  <h3 class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">
                    Utils
                  </h3>
                  <CategoryTileGrid categories={utilCategories.value} />
                </div>

                {/* Games never carry a `category` at all (see
                    `getCategories`'s doc comment) — there's nothing to
                    build a real tile grid from until the "Genre-level
                    game taxonomy" board card lands. */}
                <div>
                  <h3 class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">
                    Games
                  </h3>
                  <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
                    No genre-level breakdown yet — see the full{" "}
                    <a href="/games/" class="link link-primary">
                      Games list
                    </a>
                    .
                  </div>
                </div>
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

import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuSearch } from "@qwikest/icons/lucide";
import { AppCard } from "~/components/app-card/app-card";
import { HorizontalScroller } from "~/components/horizontal-scroller/horizontal-scroller";
import { getStats, getTrendingApps, getCategories } from "~/catalog";
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

// Sections with no real data/logic behind them yet (editorial system, events,
// collections — all tracked as their own cards on the Tuxery GitHub Project).
// Trending and category browsing used to be on this list too; both are real
// now, so they get proper sections below instead of a placeholder.
const PLACEHOLDER_SECTIONS: { title: string; note: string }[] = [
  { title: "Editorial picks", note: "Staff-curated must-haves are coming soon." },
  { title: "Monthly events", note: "A monthly events feature is still being defined." },
  {
    title: "Events & collections",
    note: "A carousel of influencer, distro, and source pages worth following is coming soon.",
  },
];

const ComingSoonSection = component$<{ title: string; note: string }>(({ title, note }) => (
  <section>
    <h2 class="text-lg font-semibold mb-2">{title}</h2>
    <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
      {note}
    </div>
  </section>
));

const AppCardLink = component$<{ app: AppSummary }>(({ app }) => (
  <a href={`/app/${encodeURIComponent(app.id)}/`} class="block w-64 shrink-0 snap-start">
    <AppCard
      iconUrl={app.iconUrl}
      name={app.name}
      description={app.shortDescription}
      sources={app.sources}
      kind={app.kind}
      contentType={app.contentType}
    />
  </a>
));

export default component$(() => {
  const stats = useStats();
  const trendingApps = useTrendingApps();
  const categories = useCategories();

  return (
    <div class="flex flex-col gap-14">
      <section class="hero bg-base-200/60 rounded-box -mx-4 md:-mx-6 px-4 md:px-6">
        <div class="hero-content text-center py-14">
          <div class="max-w-2xl">
            <h1 class="text-4xl md:text-5xl font-bold">
              One search bar. <span class="text-primary">Every</span> Linux app.
            </h1>
            <p class="py-4 text-base-content/70">
              Tuxery aggregates Flathub, the Snap Store, AppImage, and every major distro's own
              package repositories into one deduplicated catalog — search once, install from
              wherever it's actually shipped.
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
              <p class="text-sm text-base-content/50 mt-4">
                {stats.value.total.toLocaleString()} apps and games catalogued
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

          {categories.value.length > 0 && (
            <section>
              <h2 class="text-lg font-semibold mb-3">Browse by category</h2>
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

          {PLACEHOLDER_SECTIONS.map((section) => (
            <ComingSoonSection key={section.title} title={section.title} note={section.note} />
          ))}
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

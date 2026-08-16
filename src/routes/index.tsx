import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AppCard } from "~/components/app-card/app-card";
import { SearchBar } from "~/components/search-bar/search-bar";
import { searchApps, getStats, type AppSummary } from "~/catalog";

export const useInitialApps = routeLoader$(async ({ url }) => {
  return searchApps(url.searchParams.get("q") ?? "");
});

export const useStats = routeLoader$(async () => {
  return getStats();
});

const DEBOUNCE_MS = 200;

const CATEGORY_PLACEHOLDERS = [
  "Productivity",
  "New games",
  "Music",
  "Creativity",
  "Learning",
  "Movies & streaming",
  "Casual games",
  "Social network",
  "Puzzle games",
];

/** Full-width "not built yet" block for a homepage section with no real data/logic behind it. */
const ComingSoonSection = component$<{ title: string; note: string }>(({ title, note }) => (
  <section>
    <h2 class="text-lg font-semibold mb-2">{title}</h2>
    <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">{note}</div>
  </section>
));

export default component$(() => {
  const location = useLocation();
  const initialApps = useInitialApps();
  const stats = useStats();
  const query = useSignal(location.url.searchParams.get("q") ?? "");
  const results = useSignal<AppSummary[]>(initialApps.value);
  const searching = useSignal(false);

  useVisibleTask$(({ track, cleanup }) => {
    const q = track(() => query.value);
    searching.value = true;
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      results.value = (await response.json()) as AppSummary[];
      searching.value = false;
    }, DEBOUNCE_MS);
    cleanup(() => clearTimeout(timer));
  });

  // Browse-mode teaser sections (trends, events, editorial, categories) only
  // make sense above an unfiltered catalog — hidden once the visitor is
  // actively searching, same as a Store app hides its homepage rails.
  const browsing = query.value.trim() === "";
  const trending = initialApps.value.slice(0, 6);

  return (
    <div class="flex flex-col gap-12">
      <SearchBar value={query} />

      {browsing && stats.value.total > 0 && (
        <>
          <ComingSoonSection
            title="Events"
            note="A carousel of influencers, distros, and sources worth following is coming soon."
          />

          {trending.length > 0 && (
            <section>
              <h2 class="text-lg font-semibold mb-1">Apps & games trends</h2>
              <p class="text-sm text-base-content/60 mb-3">
                Real trend ranking is still TBD — showing a sample from the catalog for now.
              </p>
              <div class="flex gap-4 overflow-x-auto pb-1">
                {trending.map((app) => (
                  <a
                    key={app.id}
                    href={`/app/${encodeURIComponent(app.id)}/`}
                    class="block w-64 shrink-0"
                  >
                    <AppCard
                      iconUrl={app.iconUrl}
                      name={app.name}
                      description={app.shortDescription}
                      sources={app.sources}
                    />
                  </a>
                ))}
              </div>
            </section>
          )}

          <ComingSoonSection
            title="Download trends"
            note="Weekly download/install trends, where a source exposes them, are coming soon."
          />

          <ComingSoonSection
            title="Editorial picks"
            note="Must-have apps, monthly events, and curated collections are coming soon."
          />

          <section>
            <h2 class="text-lg font-semibold mb-1">Browse by category</h2>
            <p class="text-sm text-base-content/60 mb-3">
              The category taxonomy isn't defined yet, and apps/games aren't distinguished in the data model —
              real category browsing is coming soon.
            </p>
            <div class="flex flex-wrap gap-2">
              {CATEGORY_PLACEHOLDERS.map((label) => (
                <span
                  key={label}
                  class="btn btn-ghost btn-sm btn-disabled"
                  aria-disabled="true"
                  aria-label={`${label} (coming soon)`}
                >
                  {label}
                </span>
              ))}
            </div>
          </section>
        </>
      )}

      <section>
        <h2 class="text-lg font-semibold mb-1">{browsing ? "All apps" : "Search results"}</h2>

        {stats.value.total === 0 ? (
          <p class="text-center text-base-content/60 mt-4">
            No catalog data loaded — run <code class="font-mono">pnpm seed</code> then{" "}
            <code class="font-mono">pnpm serve</code> in <code class="font-mono">tuxery/catalog</code> first.
          </p>
        ) : searching.value ? (
          <p class="text-center text-base-content/60 mt-4">Searching…</p>
        ) : results.value.length === 0 ? (
          <p class="text-center text-base-content/60 mt-4">No apps found for "{query.value}".</p>
        ) : (
          <>
            <p class="text-sm text-base-content/60 mb-4">
              {results.value.length} of {stats.value.total} apps
            </p>

            <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
              {results.value.map((app) => (
                <a key={app.id} href={`/app/${encodeURIComponent(app.id)}/`} class="block">
                  <AppCard
                    iconUrl={app.iconUrl}
                    name={app.name}
                    description={app.shortDescription}
                    sources={app.sources}
                  />
                </a>
              ))}
            </div>
          </>
        )}
      </section>
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

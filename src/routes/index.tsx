import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AppCard } from "~/components/app-card/app-card";
import { SearchBar } from "~/components/search-bar/search-bar";
import { searchApps, getStats, type AppSummary } from "~/catalog";

export const useInitialApps = routeLoader$(async () => {
  return searchApps("");
});

export const useStats = routeLoader$(async () => {
  return getStats();
});

const DEBOUNCE_MS = 200;

export default component$(() => {
  const initialApps = useInitialApps();
  const stats = useStats();
  const query = useSignal("");
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

  return (
    <>
      <SearchBar value={query} />

      {stats.value.total === 0 ? (
        <p class="text-center text-base-content/60">
          No catalog data loaded — run <code class="font-mono">pnpm seed</code> then{" "}
          <code class="font-mono">pnpm serve</code> in <code class="font-mono">tuxery/catalog</code> first.
        </p>
      ) : searching.value ? (
        <p class="text-center text-base-content/60">Searching…</p>
      ) : results.value.length === 0 ? (
        <p class="text-center text-base-content/60">No apps found for "{query.value}".</p>
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
    </>
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

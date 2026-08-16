import { component$, useSignal } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuChevronLeft, LuChevronRight } from "@qwikest/icons/lucide";
import { AppCard } from "~/components/app-card/app-card";
import { searchApps, getStats } from "~/catalog";
import type { AppSummary } from "~/catalog-types";

export const useInitialApps = routeLoader$(async ({ url }) => {
  return searchApps(url.searchParams.get("q") ?? "");
});

export const useStats = routeLoader$(async () => {
  return getStats();
});

const TRENDS_PAGE_SIZE = 6;

// One section per bullet from the homepage layout card, kept distinct (not
// merged) so the page's overall flow/coherence can actually be judged —
// each is a plain "coming soon" block until the data/logic behind it exists
// (category taxonomy, apps-vs-games classification, editorial system, ...,
// all tracked as their own cards on the Tuxery GitHub Project).
const PLACEHOLDER_SECTIONS: { title: string; note: string }[] = [
  {
    title: "Download trends",
    note: "Weekly download/install trends, where a source exposes them, are coming soon.",
  },
  { title: "Must-have apps", note: "Editorially curated must-haves are coming soon." },
  { title: "Monthly events", note: "A monthly events feature is still being defined." },
  { title: "Productivity apps", note: "Coming soon — needs the category taxonomy to exist first." },
  {
    title: "New games",
    note: "Coming soon — needs apps/games classification and the category taxonomy.",
  },
  { title: "Music apps", note: "Coming soon — needs the category taxonomy to exist first." },
  { title: "Creativity apps", note: "Coming soon — needs the category taxonomy to exist first." },
  { title: "Learning apps", note: "Coming soon — needs the category taxonomy to exist first." },
  {
    title: "Movies & streaming apps",
    note: "Coming soon — needs the category taxonomy to exist first.",
  },
  {
    title: "Casual games",
    note: "Coming soon — needs apps/games classification and the category taxonomy.",
  },
  {
    title: "Social network apps",
    note: "Coming soon — needs the category taxonomy to exist first.",
  },
  {
    title: "Puzzle games",
    note: "Coming soon — needs apps/games classification and the category taxonomy.",
  },
  { title: "Collections", note: "Curated collections are coming soon." },
];

/** Full-width "not built yet" block for a homepage section with no real data/logic behind it. */
const ComingSoonSection = component$<{ title: string; note: string }>(({ title, note }) => (
  <section>
    <h2 class="text-lg font-semibold mb-2">{title}</h2>
    <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
      {note}
    </div>
  </section>
));

const AppCardLink = component$<{ app: AppSummary }>(({ app }) => (
  <a href={`/app/${encodeURIComponent(app.id)}/`} class="block w-64 shrink-0">
    <AppCard
      iconUrl={app.iconUrl}
      name={app.name}
      description={app.shortDescription}
      sources={app.sources}
    />
  </a>
));

export default component$(() => {
  const location = useLocation();
  const initialApps = useInitialApps();
  const stats = useStats();
  const trendsPage = useSignal(0);

  const query = location.url.searchParams.get("q") ?? "";
  const browsing = query.trim() === "";

  const trendsTotalPages = Math.max(1, Math.ceil(initialApps.value.length / TRENDS_PAGE_SIZE));
  const trendsSlice = initialApps.value.slice(
    trendsPage.value * TRENDS_PAGE_SIZE,
    trendsPage.value * TRENDS_PAGE_SIZE + TRENDS_PAGE_SIZE,
  );

  return (
    <div class="flex flex-col gap-12">
      {browsing ? (
        stats.value.total > 0 && (
          <>
            <ComingSoonSection
              title="Events"
              note="A carousel of influencer, distro, and source pages worth following is coming soon."
            />

            <section>
              <h2 class="text-lg font-semibold mb-1">Apps & games trends</h2>
              <p class="text-sm text-base-content/60 mb-3">
                Ranking criteria still TBD (recent updates, novelty, or a combination) — paginated
                by {TRENDS_PAGE_SIZE} for now.
              </p>
              <div class="flex gap-4 overflow-x-auto pb-1">
                {trendsSlice.map((app) => (
                  <AppCardLink key={app.id} app={app} />
                ))}
              </div>
              {trendsTotalPages > 1 && (
                <div class="join mt-3">
                  <button
                    type="button"
                    class="btn btn-sm join-item"
                    disabled={trendsPage.value === 0}
                    aria-label="Previous trends page"
                    onClick$={() => trendsPage.value--}
                  >
                    <LuChevronLeft />
                  </button>
                  <span class="btn btn-sm join-item btn-disabled" aria-disabled="true">
                    {trendsPage.value + 1} / {trendsTotalPages}
                  </span>
                  <button
                    type="button"
                    class="btn btn-sm join-item"
                    disabled={trendsPage.value >= trendsTotalPages - 1}
                    aria-label="Next trends page"
                    onClick$={() => trendsPage.value++}
                  >
                    <LuChevronRight />
                  </button>
                </div>
              )}
            </section>

            {PLACEHOLDER_SECTIONS.map((section) => (
              <ComingSoonSection key={section.title} title={section.title} note={section.note} />
            ))}
          </>
        )
      ) : (
        <section>
          <h2 class="text-lg font-semibold mb-1">Search results</h2>

          {initialApps.value.length === 0 ? (
            <p class="text-center text-base-content/60 mt-4">No apps found for "{query}".</p>
          ) : (
            <>
              <p class="text-sm text-base-content/60 mb-4">
                {initialApps.value.length} of {stats.value.total} apps
              </p>

              <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
                {initialApps.value.map((app) => (
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
      )}

      {stats.value.total === 0 && (
        <p class="text-center text-base-content/60">
          No catalog data loaded — run <code class="font-mono">pnpm seed</code> then{" "}
          <code class="font-mono">pnpm serve</code> in <code class="font-mono">tuxery/catalog</code>{" "}
          first.
        </p>
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

import { $, component$, Fragment, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$, server$, useLocation } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuArrowUp, LuLoader2 } from "@qwikest/icons/lucide";
import { AppCardLink } from "~/components/app-card/app-card";
import {
  browseApps,
  getCategories,
  type BrowseOptions,
  type InterfaceFilter,
  type SortOption,
  type TypeFilter,
} from "~/catalog";
import {
  BROWSE_PAGE_SIZE,
  SOURCE_LABELS,
  type AppSummary,
  type PackageSourceId,
} from "~/catalog-types";

/**
 * RPC endpoint the client calls directly (no full navigation) as the user
 * scrolls — thin wrapper around the same `browseApps` the initial
 * `routeLoader$` uses, so paginated batches stay consistent with the
 * server-rendered first page.
 */
const loadBrowsePage = server$(async function (
  query: string,
  page: number,
  options: BrowseOptions,
) {
  return browseApps(query, page, options);
});

function parseInterfaceFilter(value: string | null): InterfaceFilter {
  return value === "gui" || value === "cli" ? value : "all";
}

function parseTypeFilter(value: string | null): TypeFilter {
  return value === "game" || value === "app" ? value : "all";
}

function parseSource(value: string | null): PackageSourceId | undefined {
  return value && value in SOURCE_LABELS ? (value as PackageSourceId) : undefined;
}

function parseSort(value: string | null): SortOption {
  return value === "name-asc" || value === "name-desc" ? value : "relevance";
}

export const useBrowse = routeLoader$(async ({ url }) => {
  const query = url.searchParams.get("q") ?? "";
  const page = Math.max(0, Number(url.searchParams.get("page") ?? "1") - 1);
  return browseApps(query, page, {
    interfaceFilter: parseInterfaceFilter(url.searchParams.get("interface")),
    typeFilter: parseTypeFilter(url.searchParams.get("type")),
    category: url.searchParams.get("category") ?? undefined,
    source: parseSource(url.searchParams.get("source")),
    sort: parseSort(url.searchParams.get("sort")),
  });
});

// Scoped to the current Type filter — apps and games each draw from their
// own taxonomy now (see `tuxery/catalog`'s `CatalogApp.category` doc
// comment), so a mixed "all types" dropdown would show two disjoint label
// sets at once, e.g. "Strategy" (a game genre) next to "Productivity" (an
// app category), neither meaningful to the other type.
export const useBrowseCategories = routeLoader$(async ({ url }) =>
  getCategories(parseTypeFilter(url.searchParams.get("type"))),
);

export default component$(() => {
  const location = useLocation();
  const browse = useBrowse();
  const categories = useBrowseCategories();

  const query = location.url.searchParams.get("q") ?? "";
  const startPage = Math.max(0, Number(location.url.searchParams.get("page") ?? "1") - 1);
  const interfaceFilter = parseInterfaceFilter(location.url.searchParams.get("interface"));
  const typeFilter = parseTypeFilter(location.url.searchParams.get("type"));
  const category = location.url.searchParams.get("category") ?? undefined;
  const source = parseSource(location.url.searchParams.get("source"));
  const sort = parseSort(location.url.searchParams.get("sort"));
  const options: BrowseOptions = { interfaceFilter, typeFilter, category, source, sort };

  // One entry per loaded page, kept separate (rather than one flat array)
  // purely so a divider can be rendered between batches — the actual grid
  // below flattens them back into one continuous layout.
  const batches = useSignal<AppSummary[][]>([browse.value.apps]);
  const loadedCount = useSignal(browse.value.apps.length);
  const nextPage = useSignal(startPage + 1);
  const loading = useSignal(false);
  const sentinelRef = useSignal<HTMLElement>();

  const loadMore = $(async () => {
    if (loading.value || loadedCount.value >= browse.value.total) return;
    loading.value = true;
    const result = await loadBrowsePage(query, nextPage.value, options);
    if (result.apps.length > 0) {
      batches.value = [...batches.value, result.apps];
      loadedCount.value += result.apps.length;
      nextPage.value += 1;
    } else {
      // Server disagrees with the client's `total` (data changed
      // mid-scroll) — stop rather than looping on empty pages forever.
      loadedCount.value = browse.value.total;
    }
    loading.value = false;
  });

  useVisibleTask$(({ cleanup }) => {
    const el = sentinelRef.value;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore();
    });
    observer.observe(el);
    cleanup(() => observer.disconnect());
  });

  return (
    <div id="top" class="flex flex-col gap-6">
      <div>
        <h1 class="text-3xl font-bold mb-2">Browse</h1>
        <p class="text-base-content/70">Every app and game in the catalog.</p>
      </div>

      <form action="/browse" method="get" class="glass-card flex flex-wrap gap-3 items-end p-4">
        <label class="form-control flex-1 min-w-[12rem]">
          <span class="label-text text-sm mb-1">Name</span>
          <input
            type="search"
            name="q"
            value={query}
            placeholder="Search by name, id, or description…"
            class="input input-sm w-full"
          />
        </label>

        <label class="form-control min-w-[9rem]">
          <span class="label-text text-sm mb-1">Type</span>
          <select name="type" class="select select-sm w-full">
            <option value="all" selected={typeFilter === "all"}>
              All
            </option>
            <option value="app" selected={typeFilter === "app"}>
              Apps
            </option>
            <option value="game" selected={typeFilter === "game"}>
              Games
            </option>
          </select>
        </label>

        <label class="form-control min-w-[9rem]">
          <span class="label-text text-sm mb-1">Interface</span>
          <select name="interface" class="select select-sm w-full">
            <option value="all" selected={interfaceFilter === "all"}>
              All
            </option>
            <option value="gui" selected={interfaceFilter === "gui"}>
              GUI
            </option>
            <option value="cli" selected={interfaceFilter === "cli"}>
              CLI
            </option>
          </select>
        </label>

        <label class="form-control min-w-[10rem]">
          <span class="label-text text-sm mb-1">Category</span>
          <select name="category" class="select select-sm w-full">
            <option value="" selected={!category}>
              All
            </option>
            {categories.value.map((c) => (
              <option key={c.category} value={c.category} selected={c.category === category}>
                {`${c.category} (${c.count.toLocaleString()})`}
              </option>
            ))}
          </select>
        </label>

        <label class="form-control min-w-[9rem]">
          <span class="label-text text-sm mb-1">Sort</span>
          <select name="sort" class="select select-sm w-full">
            <option value="relevance" selected={sort === "relevance"}>
              Relevance
            </option>
            <option value="name-asc" selected={sort === "name-asc"}>
              Name (A–Z)
            </option>
            <option value="name-desc" selected={sort === "name-desc"}>
              Name (Z–A)
            </option>
          </select>
        </label>

        {source && <input type="hidden" name="source" value={source} />}

        <button type="submit" class="btn btn-primary btn-sm">
          Filter
        </button>
      </form>

      {(category || source) && (
        <div class="flex flex-wrap gap-2 items-center text-sm">
          <span class="text-base-content/60">Filtering by:</span>
          {category && (
            <a href="/browse/" class="badge badge-outline gap-1 hover:badge-error">
              {category}
              <span aria-hidden="true">✕</span>
            </a>
          )}
          {source && <span class="badge badge-outline">{SOURCE_LABELS[source]}</span>}
        </div>
      )}

      <p class="text-sm text-base-content/60">
        "Games" is a confirmed match, "Apps" its complement — a rare undetected game may still show
        up as an app. "GUI"/"CLI" is a separate best-effort split by desktop-file detection, not a
        guarantee.
      </p>

      {browse.value.apps.length === 0 ? (
        <p class="text-center text-base-content/60 mt-4">
          No apps found{query ? ` for "${query}"` : ""}.
        </p>
      ) : (
        <>
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <p class="text-sm text-base-content/60">
              Showing {browse.value.total.toLocaleString()} apps across{" "}
              {Math.max(1, Math.ceil(browse.value.total / BROWSE_PAGE_SIZE)).toLocaleString()} pages
            </p>
            <a
              href="#top"
              class="link link-hover text-sm text-base-content/60 flex items-center gap-1"
            >
              <LuArrowUp aria-hidden="true" />
              Top
            </a>
          </div>

          <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
            {batches.value.map((batch, batchIndex) => (
              <Fragment key={`page-${startPage + batchIndex}`}>
                {batchIndex > 0 && (
                  <div class="col-span-full flex items-center gap-3 text-xs text-base-content/40 my-1">
                    <span class="flex-1 border-t border-base-300" />
                    Page {startPage + batchIndex + 1}
                    <span class="flex-1 border-t border-base-300" />
                    <a href="#top" class="link link-hover flex items-center gap-1">
                      <LuArrowUp aria-hidden="true" />
                      Top
                    </a>
                  </div>
                )}
                {batch.map((app) => (
                  <AppCardLink key={app.id} app={app} />
                ))}
              </Fragment>
            ))}
          </div>

          {loadedCount.value < browse.value.total && (
            <div ref={sentinelRef} class="flex justify-center py-6 text-base-content/50">
              <LuLoader2 class="animate-spin text-xl" aria-label="Loading more apps" />
            </div>
          )}
        </>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Browse — Tuxery",
  meta: [
    {
      name: "description",
      content: "Browse every app and game in the Tuxery catalog, with filters.",
    },
  ],
};

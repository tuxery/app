import { $, component$, Fragment, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { routeLoader$, server$, useLocation } from "@qwik.dev/router";
import type { DocumentHead, RequestEventBase, RequestHandler } from "@qwik.dev/router";
import { LuArrowUp, LuLoader2 } from "@qwikest/icons/lucide";
import { reportDataProblemUrl } from "~/contribute-links";
import { AppCardLink } from "~/components/app-card/app-card";
import {
  browseApps,
  getCategories,
  getSubcategories,
  type BrowseOptions,
  type SubcategoryCount,
  type InterfaceFilter,
  type SortOption,
  type TypeFilter,
} from "~/catalog";
import {
  AGE_FILTERS,
  BROWSE_PAGE_SIZE,
  formatAgeBracket,
  isInstallSource,
  parseAgeFilter,
  SOURCE_LABELS,
  type AppSummary,
  type PackageSourceId,
} from "~/catalog-types";
import { parsePageParam } from "~/browse-page";
import { orderSubcategories, retiredCategoryRedirect } from "~/categories";
import type { ServerEnv } from "~/server-env";
import { SEARCH_MIN_WORD_LENGTH } from "~/search-fts";
import { resolveServerEnv } from "~/server-env";

/**
 * RPC endpoint the client calls directly (no full navigation) as the user
 * scrolls — thin wrapper around the same `browseApps` the initial
 * `routeLoader$` uses, so paginated batches stay consistent with the
 * server-rendered first page.
 */
const loadBrowsePage = server$(async function (
  this: RequestEventBase,
  query: string,
  page: number,
  options: BrowseOptions,
) {
  // `false`: loadMore never reads a later page's `total`, so don't pay for
  // a free-text COUNT(*) on every scroll.
  return browseApps(resolveServerEnv(this.platform), query, page, options, false);
});

function parseInterfaceFilter(value: string | null): InterfaceFilter {
  return value === "gui" || value === "cli" ? value : "all";
}

function parseTypeFilter(value: string | null): TypeFilter {
  return value === "game" || value === "app" ? value : "all";
}

function parseSource(value: string | null): PackageSourceId | undefined {
  // Own keys only: `in` also accepts `constructor`, `toString`, ...
  return value && isInstallSource(value) ? value : undefined;
}

function parseLicense(value: string | null): "free" | undefined {
  return value === "free" ? value : undefined;
}

function parseSort(value: string | null): SortOption {
  return value === "name-asc" || value === "name-desc" ? value : "relevance";
}

/**
 * `sub` when it names a subcategory of `category` in `subcategories`,
 * else nothing: the filter form keeps `sub` across a change of category,
 * and a subcategory of the previous one would list nothing.
 */
function validSubcategory(
  subcategories: readonly SubcategoryCount[],
  category: string | undefined,
  sub: string | null,
): string | undefined {
  if (!category || !sub) return undefined;
  return subcategories.some((s) => s.category === category && s.subcategory === sub)
    ? sub
    : undefined;
}

async function requestedSubcategory(
  env: ServerEnv,
  url: URL,
  typeFilter: TypeFilter,
): Promise<string | undefined> {
  const sub = url.searchParams.get("sub");
  if (!sub) return undefined;
  return validSubcategory(
    await getSubcategories(env, typeFilter),
    url.searchParams.get("category") ?? undefined,
    sub,
  );
}

// A link to a category id catalog no longer publishes (one that was split)
// goes where its parts are listed rather than to an empty listing.
export const onGet: RequestHandler = ({ url, redirect }) => {
  const target = retiredCategoryRedirect(url.searchParams.get("category"));
  if (target) throw redirect(302, target);
};

// `search` lists every query param this loader reads: Qwik Router v2 strips
// the others from its request event (and only re-fetches it when a listed
// one changes). Same for useBrowseCategories below.
export const useBrowse = routeLoader$(
  async (requestEvent) => {
    const { url } = requestEvent;
    const query = url.searchParams.get("q") ?? "";
    const page = parsePageParam(url.searchParams.get("page"));
    const env = resolveServerEnv(requestEvent.platform);
    const typeFilter = parseTypeFilter(url.searchParams.get("type"));
    return browseApps(env, query, page, {
      interfaceFilter: parseInterfaceFilter(url.searchParams.get("interface")),
      typeFilter,
      category: url.searchParams.get("category") ?? undefined,
      subcategory: await requestedSubcategory(env, url, typeFilter),
      source: parseSource(url.searchParams.get("source")),
      license: parseLicense(url.searchParams.get("license")),
      age: parseAgeFilter(url.searchParams.get("age")),
      sort: parseSort(url.searchParams.get("sort")),
    });
  },
  {
    search: [
      "q",
      "page",
      "interface",
      "type",
      "category",
      "sub",
      "source",
      "license",
      "age",
      "sort",
    ],
  },
);

// Scoped to the current Type filter — apps and games each draw from their
// own taxonomy now (see `tuxery/catalog`'s `CatalogApp.category` doc
// comment), so a mixed "all types" dropdown would show two disjoint label
// sets at once, e.g. "Strategy" (a game genre) next to "Productivity" (an
// app category), neither meaningful to the other type.
export const useBrowseCategories = routeLoader$(
  async (requestEvent) =>
    getCategories(
      resolveServerEnv(requestEvent.platform),
      parseTypeFilter(requestEvent.url.searchParams.get("type")),
    ),
  { search: ["type"] },
);

// Every subcategory with its count, for the chips of a category's listing.
export const useBrowseSubcategories = routeLoader$(
  async (requestEvent) =>
    getSubcategories(
      resolveServerEnv(requestEvent.platform),
      parseTypeFilter(requestEvent.url.searchParams.get("type")),
    ),
  { search: ["type"] },
);

export default component$(() => {
  const location = useLocation();
  const browse = useBrowse();
  const categories = useBrowseCategories();
  const subcategories = useBrowseSubcategories();

  const query = location.url.searchParams.get("q") ?? "";
  const startPage = parsePageParam(location.url.searchParams.get("page"));
  const interfaceFilter = parseInterfaceFilter(location.url.searchParams.get("interface"));
  const typeFilter = parseTypeFilter(location.url.searchParams.get("type"));
  const category = location.url.searchParams.get("category") ?? undefined;
  const subcategory = validSubcategory(
    subcategories.value,
    category,
    location.url.searchParams.get("sub"),
  );
  const categorySubcategories = category
    ? orderSubcategories(subcategories.value.filter((s) => s.category === category))
    : [];
  // A chip keeps every other filter and starts again at the first page.
  const subcategoryLink = (sub: string | undefined) => {
    const url = new URL(location.url);
    url.searchParams.delete("page");
    if (sub) url.searchParams.set("sub", sub);
    else url.searchParams.delete("sub");
    return `${url.pathname}${url.search}`;
  };
  const source = parseSource(location.url.searchParams.get("source"));
  const license = parseLicense(location.url.searchParams.get("license"));
  const age = parseAgeFilter(location.url.searchParams.get("age"));
  const sort = parseSort(location.url.searchParams.get("sort"));
  const options: BrowseOptions = {
    interfaceFilter,
    typeFilter,
    category,
    subcategory,
    source,
    license,
    age,
    sort,
  };

  // One entry per loaded page, kept separate (rather than one flat array)
  // purely so a divider can be rendered between batches — the actual grid
  // below flattens them back into one continuous layout.
  const batches = useSignal<AppSummary[][]>([browse.value.apps]);
  const loadedCount = useSignal(browse.value.apps.length);
  const nextPage = useSignal(startPage + 1);
  // A capped total ("1,000+", see `BrowseResult.totalCapped`) can't tell
  // when the results end, so scrolling keeps going until a short page.
  const hasMore = useSignal(
    browse.value.totalCapped
      ? browse.value.apps.length === BROWSE_PAGE_SIZE
      : browse.value.apps.length < browse.value.total,
  );
  const loading = useSignal(false);
  const sentinelRef = useSignal<HTMLElement>();

  const loadMore = $(async () => {
    if (loading.value || !hasMore.value) return;
    loading.value = true;
    const result = await loadBrowsePage(query, nextPage.value, options);
    if (result.apps.length > 0) {
      batches.value = [...batches.value, result.apps];
      loadedCount.value += result.apps.length;
      nextPage.value += 1;
    }
    // A short (or empty) page is the last one, whatever `total` said —
    // capped, or out of date because data changed mid-scroll.
    hasMore.value =
      result.apps.length === BROWSE_PAGE_SIZE &&
      (browse.value.totalCapped === true || loadedCount.value < browse.value.total);
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
            minLength={SEARCH_MIN_WORD_LENGTH}
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

        {browse.value.ageFilter && (
          <label class="form-control min-w-[9rem]">
            <span class="label-text text-sm mb-1">Suitable for</span>
            <select name="age" class="select select-sm w-full">
              <option value="" selected={age === undefined}>
                Any rating
              </option>
              {AGE_FILTERS.map((filter) => (
                <option key={filter} value={String(filter)} selected={age === filter}>
                  {formatAgeBracket(filter)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label class="form-control min-w-[9rem]">
          <span class="label-text text-sm mb-1">Sort</span>
          <select name="sort" class="select select-sm w-full">
            <option value="relevance" selected={sort === "relevance"}>
              {!query && category ? "Popular first" : "Relevance"}
            </option>
            <option value="name-asc" selected={sort === "name-asc"}>
              Name (A–Z)
            </option>
            <option value="name-desc" selected={sort === "name-desc"}>
              Name (Z–A)
            </option>
          </select>
        </label>

        {browse.value.freeFilter && (
          <label class="label cursor-pointer gap-2 min-h-8">
            <input
              type="checkbox"
              name="license"
              value="free"
              checked={license === "free"}
              class="checkbox checkbox-sm"
            />
            <span class="label-text text-sm">Free software only</span>
          </label>
        )}

        {source && <input type="hidden" name="source" value={source} />}
        {subcategory && <input type="hidden" name="sub" value={subcategory} />}

        <button type="submit" class="btn btn-primary btn-sm">
          Filter
        </button>
      </form>

      {(category || source) && (
        <div class="flex flex-wrap gap-2 items-center text-sm">
          <span class="text-base-content/70">Filtering by:</span>
          {category && (
            <a href="/browse/" class="badge badge-outline gap-1 hover:badge-error">
              {category}
              <span aria-hidden="true">✕</span>
            </a>
          )}
          {subcategory && (
            <a
              href={subcategoryLink(undefined)}
              class="badge badge-outline gap-1 hover:badge-error"
            >
              {subcategory}
              <span aria-hidden="true">✕</span>
            </a>
          )}
          {source && <span class="badge badge-outline">{SOURCE_LABELS[source]}</span>}
        </div>
      )}

      {categorySubcategories.length > 0 && (
        <nav aria-label={`Kinds of ${category}`} class="flex flex-wrap gap-2">
          <a
            href={subcategoryLink(undefined)}
            class={["btn btn-sm", subcategory ? "btn-ghost" : "btn-primary"]}
            aria-current={subcategory ? undefined : "page"}
          >
            All
          </a>
          {categorySubcategories.map((s) => (
            <a
              key={s.subcategory}
              href={subcategoryLink(s.subcategory)}
              class={["btn btn-sm", s.subcategory === subcategory ? "btn-primary" : "btn-ghost"]}
              aria-current={s.subcategory === subcategory ? "page" : undefined}
            >
              {s.subcategory}
              <span class="opacity-60 font-normal">{s.count.toLocaleString()}</span>
            </a>
          ))}
        </nav>
      )}

      <p class="text-sm text-base-content/70">
        "Games" is a confirmed match, "Apps" its complement — a rare undetected game may still show
        up as an app. "GUI"/"CLI" is a separate best-effort split by desktop-file detection, not a
        guarantee.
        {age !== undefined && (
          <>
            {" "}
            "Suitable for {formatAgeBracket(age)}" lists products rated {formatAgeBracket(age)}
            {age === 3 ? "" : " or lower"} by Flathub, the distributions' app catalogs or a rating
            board. Most of the catalog has no rating and never shows under an age:{" "}
            <a href="/docs/glossary/#age-rating" class="link">
              what the ages mean
            </a>
            .
          </>
        )}
      </p>

      {category === "To Classify" && (
        <div class="border border-dashed border-base-300 rounded-box p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <p class="text-sm text-base-content/70">
            "To Classify" isn't a real category — it's everything with no category signal yet. Only
            Flathub and elementary AppCenter's own metadata carries one today, so most of the
            catalog lands here rather than a guess. Know what one of these actually is?
          </p>
          <a
            href={reportDataProblemUrl()}
            target="_blank"
            rel="noopener"
            class="btn btn-sm btn-outline shrink-0"
          >
            Suggest a category
          </a>
        </div>
      )}

      {browse.value.queryTooShort ? (
        <p class="text-center text-base-content/70 mt-4">
          Type at least {SEARCH_MIN_WORD_LENGTH} characters to search.
        </p>
      ) : browse.value.apps.length === 0 ? (
        <p class="text-center text-base-content/70 mt-4">
          No apps found{query ? ` for "${query}"` : ""}.
        </p>
      ) : (
        <>
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <p class="text-sm text-base-content/70">
              Showing {browse.value.total.toLocaleString()}
              {browse.value.totalCapped ? "+" : ""} apps across{" "}
              {Math.max(1, Math.ceil(browse.value.total / BROWSE_PAGE_SIZE)).toLocaleString()}
              {browse.value.totalCapped ? "+" : ""} pages
            </p>
            <a
              href="#top"
              class="link link-hover text-sm text-base-content/70 flex items-center gap-1"
            >
              <LuArrowUp aria-hidden="true" />
              Top
            </a>
          </div>

          <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
            {batches.value.map((batch, batchIndex) => (
              <Fragment key={`page-${startPage + batchIndex}`}>
                {batchIndex > 0 && (
                  <div class="col-span-full flex items-center gap-3 text-xs text-base-content/70 my-1">
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

          {hasMore.value && (
            <div ref={sentinelRef} class="flex justify-center py-6 text-base-content/70">
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

import { component$ } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuChevronLeft, LuChevronRight } from "@qwikest/icons/lucide";
import { AppCard } from "~/components/app-card/app-card";
import { browseApps, getCategories, type InterfaceFilter, type TypeFilter } from "~/catalog";
import { BROWSE_PAGE_SIZE, SOURCE_LABELS, type PackageSourceId } from "~/catalog-types";

function parseInterfaceFilter(value: string | null): InterfaceFilter {
  return value === "gui" ? "gui" : "all";
}

function parseTypeFilter(value: string | null): TypeFilter {
  return value === "game" ? "game" : "all";
}

function parseSource(value: string | null): PackageSourceId | undefined {
  return value && value in SOURCE_LABELS ? (value as PackageSourceId) : undefined;
}

export const useBrowse = routeLoader$(async ({ url }) => {
  const query = url.searchParams.get("q") ?? "";
  const page = Math.max(0, Number(url.searchParams.get("page") ?? "1") - 1);
  return browseApps(query, page, {
    interfaceFilter: parseInterfaceFilter(url.searchParams.get("interface")),
    typeFilter: parseTypeFilter(url.searchParams.get("type")),
    category: url.searchParams.get("category") ?? undefined,
    source: parseSource(url.searchParams.get("source")),
  });
});

export const useBrowseCategories = routeLoader$(async () => getCategories());

export default component$(() => {
  const location = useLocation();
  const browse = useBrowse();
  const categories = useBrowseCategories();

  const query = location.url.searchParams.get("q") ?? "";
  const page = Math.max(1, Number(location.url.searchParams.get("page") ?? "1"));
  const interfaceFilter = parseInterfaceFilter(location.url.searchParams.get("interface"));
  const typeFilter = parseTypeFilter(location.url.searchParams.get("type"));
  const category = location.url.searchParams.get("category") ?? undefined;
  const source = parseSource(location.url.searchParams.get("source"));
  const totalPages = Math.max(1, Math.ceil(browse.value.total / BROWSE_PAGE_SIZE));

  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (typeFilter === "game") params.set("type", "game");
    if (interfaceFilter === "gui") params.set("interface", "gui");
    if (category) params.set("category", category);
    if (source) params.set("source", source);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/browse/?${qs}` : "/browse/";
  };

  return (
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-3xl font-bold mb-2">Browse</h1>
        <p class="text-base-content/70">
          Every app and game in the catalog, {BROWSE_PAGE_SIZE} at a time.
        </p>
      </div>

      <form
        action="/browse"
        method="get"
        class="flex flex-wrap gap-3 items-end bg-base-200/50 border border-base-300 rounded-box p-4"
      >
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
              GUI apps
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
        "Games" and "GUI apps" only show confirmed matches — the catalog has no reliable way yet to
        say a package is definitely not a game or CLI-only, so "All" still includes both.
      </p>

      {browse.value.apps.length === 0 ? (
        <p class="text-center text-base-content/60 mt-4">
          No apps found{query ? ` for "${query}"` : ""}.
        </p>
      ) : (
        <>
          <p class="text-sm text-base-content/60">
            {browse.value.total.toLocaleString()} apps — page {page} of {totalPages}
          </p>

          <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
            {browse.value.apps.map((app) => (
              <a key={app.id} href={`/app/${encodeURIComponent(app.id)}/`} class="block">
                <AppCard
                  iconUrl={app.iconUrl}
                  name={app.name}
                  description={app.shortDescription}
                  sources={app.sources}
                  kind={app.kind}
                  contentType={app.contentType}
                />
              </a>
            ))}
          </div>

          <div class="join self-center">
            {page > 1 ? (
              <a href={pageHref(page - 1)} class="btn btn-sm join-item" aria-label="Previous page">
                <LuChevronLeft />
              </a>
            ) : (
              <span
                class="btn btn-sm join-item btn-disabled"
                aria-disabled="true"
                aria-label="Previous page"
              >
                <LuChevronLeft />
              </span>
            )}
            <span class="btn btn-sm join-item btn-disabled" aria-disabled="true">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <a href={pageHref(page + 1)} class="btn btn-sm join-item" aria-label="Next page">
                <LuChevronRight />
              </a>
            ) : (
              <span
                class="btn btn-sm join-item btn-disabled"
                aria-disabled="true"
                aria-label="Next page"
              >
                <LuChevronRight />
              </span>
            )}
          </div>
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

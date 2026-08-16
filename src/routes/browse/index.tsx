import { component$ } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuChevronLeft, LuChevronRight } from "@qwikest/icons/lucide";
import { AppCard } from "~/components/app-card/app-card";
import { browseApps } from "~/catalog";
import { BROWSE_PAGE_SIZE } from "~/catalog-types";

export const useBrowse = routeLoader$(async ({ url }) => {
  const query = url.searchParams.get("q") ?? "";
  const page = Math.max(0, Number(url.searchParams.get("page") ?? "1") - 1);
  return browseApps(query, page);
});

export default component$(() => {
  const location = useLocation();
  const browse = useBrowse();

  const query = location.url.searchParams.get("q") ?? "";
  const page = Math.max(1, Number(location.url.searchParams.get("page") ?? "1"));
  const totalPages = Math.max(1, Math.ceil(browse.value.total / BROWSE_PAGE_SIZE));

  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/browse/?${qs}` : "/browse/";
  };

  return (
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-3xl font-bold mb-2">Browse</h1>
        <p class="text-base-content/70">Every app and game in the catalog, {BROWSE_PAGE_SIZE} at a time.</p>
      </div>

      <form
        action="/browse"
        method="get"
        class="flex flex-wrap gap-3 items-end border border-base-300 rounded-box p-4"
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
          <span class="label-text text-sm mb-1" aria-label="Type (coming soon)">
            Type
          </span>
          <select class="select select-sm w-full" disabled aria-disabled="true">
            <option>All</option>
            <option>Software</option>
            <option>Game</option>
          </select>
        </label>

        <label class="form-control min-w-[9rem]">
          <span class="label-text text-sm mb-1" aria-label="Interface (coming soon)">
            Interface
          </span>
          <select class="select select-sm w-full" disabled aria-disabled="true">
            <option>All</option>
            <option>GUI</option>
            <option>CLI</option>
          </select>
        </label>

        <label class="form-control min-w-[9rem]">
          <span class="label-text text-sm mb-1" aria-label="Category (coming soon)">
            Category
          </span>
          <select class="select select-sm w-full" disabled aria-disabled="true">
            <option>All</option>
          </select>
        </label>

        <button type="submit" class="btn btn-primary btn-sm">
          Filter
        </button>
      </form>

      <p class="text-sm text-base-content/60">
        Type, interface, and category filters are coming soon — they need classification and taxonomy work
        that isn't done yet (tracked on the Tuxery GitHub Project).
      </p>

      {browse.value.apps.length === 0 ? (
        <p class="text-center text-base-content/60 mt-4">No apps found{query ? ` for "${query}"` : ""}.</p>
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
              <span class="btn btn-sm join-item btn-disabled" aria-disabled="true" aria-label="Previous page">
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
              <span class="btn btn-sm join-item btn-disabled" aria-disabled="true" aria-label="Next page">
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

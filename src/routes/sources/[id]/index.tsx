import { component$ } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import { LuExternalLink } from "@qwikest/icons/lucide";
import { AppCardLink } from "~/components/app-card/app-card";
import { Logo } from "~/components/logo/logo";
import { getRecentlyUpdatedAppsBySource, getTrendingAppsBySource } from "~/catalog";
import { SOURCE_LOGOS } from "~/data/logos";
import { STORE_PAGES } from "~/data/store-pages";
import { resolveServerEnv } from "~/server-env";

function findStorePage(id: string) {
  return STORE_PAGES.find((store) => store.id === id);
}

export const useStorePage = routeLoader$(async (requestEvent) => {
  const store = findStorePage(requestEvent.params.id ?? "");
  if (!store) {
    requestEvent.status(404);
    return null;
  }

  const env = resolveServerEnv(requestEvent.platform);
  const [apps, recent] = await Promise.all([
    getTrendingAppsBySource(env, store.id),
    getRecentlyUpdatedAppsBySource(env, store.id),
  ]);
  return { store, apps, recent };
});

export default component$(() => {
  const data = useStorePage();
  if (!data.value) return <p class="text-base-content/70">Store not found.</p>;

  const { store, apps, recent } = data.value;

  return (
    <div class="flex flex-col gap-10">
      <div class="hero bg-base-200/60 rounded-box -mx-4 md:-mx-6 px-4 md:px-6">
        <div class="hero-content text-center py-12">
          <div class="max-w-xl flex flex-col items-center gap-4">
            <Logo slug={SOURCE_LOGOS[store.id]} class="w-14 h-14 text-base-content/80" />
            <h1 class="text-3xl font-bold">{store.name}</h1>
            <p class="text-base-content/80">{store.tagline}</p>
            <a
              href={store.externalUrl}
              target="_blank"
              rel="noopener"
              class="btn btn-primary gap-2"
            >
              Visit {store.name}
              <LuExternalLink />
            </a>
          </div>
        </div>
      </div>

      <section>
        <h2 class="text-lg font-semibold mb-2">About {store.name}</h2>
        <p class="text-base-content/70">
          {store.method}{" "}
          <a href={`/docs/sources/${store.id}/`} class="link link-primary">
            How Tuxery uses {store.name} →
          </a>
        </p>
      </section>

      <section>
        <div class="flex items-baseline justify-between mb-3">
          <h2 class="text-lg font-semibold">Trending on {store.name}</h2>
          <a
            href={`/browse/?source=${encodeURIComponent(store.id)}`}
            class="link link-primary text-sm"
          >
            Browse everything →
          </a>
        </div>
        {apps.length === 0 ? (
          <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/70">
            No trending data available yet.
          </div>
        ) : (
          <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
            {apps.map((app) => (
              <AppCardLink key={app.id} app={app} />
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h2 class="text-lg font-semibold mb-1">Recently updated on {store.name}</h2>
          {store.recentNote && <p class="text-sm text-base-content/70 mb-3">{store.recentNote}</p>}
          <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
            {recent.map((app) => (
              <AppCardLink key={app.id} app={app} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useStorePage);
  return {
    title: data ? `${data.store.name} — Tuxery` : "Not found — Tuxery",
    meta: data ? [{ name: "description", content: data.store.tagline }] : [],
  };
};

import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuExternalLink } from "@qwikest/icons/lucide";
import { AppCardLink } from "~/components/app-card/app-card";
import { getTrendingAppsBySource } from "~/catalog";
import type { PackageSourceId } from "~/catalog-types";
import { resolveServerEnv } from "~/server-env";

interface StorePageInfo {
  id: PackageSourceId;
  name: string;
  tagline: string;
  method: string;
  externalUrl: string;
}

// Only the sources with a real, browsable storefront of their own get a
// dedicated page — not every `~/routes/sources` credit (a distro's raw
// package index isn't a "store" anyone visits directly the way Flathub,
// the Snap Store, GOG, or Lutris are). Two universal app stores + two
// gaming storefronts, replacing the homepage's old "All games"/"Lutris
// only"/"All apps" tiles (those still exist — see /apps/, /games/,
// /browse/ — this is a different, source-scoped surface).
const STORE_PAGES: StorePageInfo[] = [
  {
    id: "flatpak-flathub",
    name: "Flathub",
    tagline: "The Flatpak store — sandboxed apps that run the same on every distro.",
    method: "Flathub's own appstream repodata feed.",
    externalUrl: "https://flathub.org",
  },
  {
    id: "snap-snapcraft",
    name: "Snap Store",
    tagline: "Canonical's universal package store, pre-installed on Ubuntu.",
    method: "Snapcraft's public search API, swept by category and letter.",
    externalUrl: "https://snapcraft.io/store",
  },
  {
    id: "gog",
    name: "GOG",
    tagline: "DRM-free games, curated and sold directly by GOG.com.",
    method: "GOG's own catalog API, scoped to Linux-compatible titles.",
    externalUrl: "https://www.gog.com",
  },
  {
    id: "lutris",
    name: "Lutris",
    tagline: "Open-source gaming platform with ready-made installers for native Linux games.",
    method: "Lutris's installer API, scoped to native Linux installers.",
    externalUrl: "https://lutris.net",
  },
];

function findStorePage(id: string): StorePageInfo | undefined {
  return STORE_PAGES.find((store) => store.id === id);
}

export const useStorePage = routeLoader$(async (requestEvent) => {
  const store = findStorePage(requestEvent.params.id ?? "");
  if (!store) {
    requestEvent.status(404);
    return null;
  }

  const apps = await getTrendingAppsBySource(resolveServerEnv(requestEvent.platform), store.id);
  return { store, apps };
});

export default component$(() => {
  const data = useStorePage();
  if (!data.value) return <p class="text-base-content/60">Store not found.</p>;

  const { store, apps } = data.value;

  return (
    <div class="flex flex-col gap-10">
      <div class="hero bg-base-200/60 rounded-box -mx-4 md:-mx-6 px-4 md:px-6">
        <div class="hero-content text-center py-12">
          <div class="max-w-xl flex flex-col items-center gap-4">
            <h1 class="text-3xl font-bold">{store.name}</h1>
            <p class="text-base-content/70">{store.tagline}</p>
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
        <p class="text-base-content/70">{store.method}</p>
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
          <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
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

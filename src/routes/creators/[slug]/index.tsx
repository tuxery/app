import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AppCard } from "~/components/app-card/app-card";
import { getAppsByIds } from "~/catalog";
import { getInfluencerPage, type InfluencerBlock } from "~/data/influencer-pages";
import type { AppSummary } from "~/catalog-types";

export const usePage = routeLoader$(async (requestEvent) => {
  const page = getInfluencerPage(requestEvent.params.slug ?? "");
  if (!page) {
    requestEvent.status(404);
    return null;
  }

  // Resolves every `apps` block's ids in one batch rather than one query
  // per block — cheap even for a page with several app-grid sections.
  const allAppIds = page.blocks.flatMap((block) => (block.type === "apps" ? block.appIds : []));
  const apps = await getAppsByIds(allAppIds);
  const appsById = new Map(apps.map((app) => [app.id, app]));

  return { page, appsById: Object.fromEntries(appsById) };
});

const TextBlockView = component$<{ block: Extract<InfluencerBlock, { type: "text" }> }>(
  ({ block }) => (
    <section>
      {block.heading && <h2 class="text-lg font-semibold mb-2">{block.heading}</h2>}
      <p class="text-base-content/80 whitespace-pre-line">{block.body}</p>
    </section>
  ),
);

const AppsBlockView = component$<{
  block: Extract<InfluencerBlock, { type: "apps" }>;
  appsById: Record<string, AppSummary>;
}>(({ block, appsById }) => {
  // References that no longer resolve (a since-removed/re-merged app id)
  // are dropped rather than shown broken — editorial content pointing at
  // stale ids shouldn't break the page.
  const apps = block.appIds.map((id) => appsById[id]).filter((app): app is AppSummary => !!app);
  if (apps.length === 0) return null;

  return (
    <section>
      {block.heading && <h2 class="text-lg font-semibold mb-3">{block.heading}</h2>}
      <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
        {apps.map((app) => (
          <a key={app.id} href={`/app/${encodeURIComponent(app.id)}/`} class="block">
            <AppCard
              iconUrl={app.iconUrl}
              name={app.name}
              description={app.shortDescription}
              sources={app.sources}
              kind={app.kind}
              contentType={app.contentType}
              category={app.category}
              rating={app.rating}
            />
          </a>
        ))}
      </div>
    </section>
  );
});

export default component$(() => {
  const data = usePage();
  if (!data.value) return <p class="text-base-content/60">Page not found.</p>;

  const { page, appsById } = data.value;

  return (
    <div class="flex flex-col gap-10">
      <div class="hero bg-base-200/60 rounded-box -mx-4 md:-mx-6 px-4 md:px-6">
        <div class="hero-content text-center py-10">
          <div class="max-w-xl">
            {page.avatarUrl && (
              <div class="avatar mb-4">
                <div class="w-20 rounded-full">
                  <img src={page.avatarUrl} alt="" />
                </div>
              </div>
            )}
            <h1 class="text-3xl font-bold">{page.name}</h1>
            <p class="text-base-content/70 mt-2">{page.tagline}</p>
          </div>
        </div>
      </div>

      {page.blocks.map((block, index) =>
        block.type === "text" ? (
          <TextBlockView key={index} block={block} />
        ) : (
          <AppsBlockView key={index} block={block} appsById={appsById} />
        ),
      )}
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(usePage);
  return {
    title: data ? `${data.page.name} — Tuxery` : "Not found — Tuxery",
    meta: data ? [{ name: "description", content: data.page.tagline }] : [],
  };
};

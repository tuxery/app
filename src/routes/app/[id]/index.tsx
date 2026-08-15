import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuPackage } from "@qwikest/icons/lucide";
import { formatBytes, getAppById, SOURCE_LABELS, type CatalogApp } from "~/catalog";

export const useApp = routeLoader$(async (requestEvent): Promise<CatalogApp | null> => {
  const id = decodeURIComponent(requestEvent.params.id ?? "");
  const app = await getAppById(id);
  if (!app) requestEvent.status(404);
  return app;
});

export default component$(() => {
  const app = useApp();
  const a = app.value;

  if (!a) {
    return (
      <div class="text-center py-24">
        <h1 class="text-2xl font-bold mb-2">App not found</h1>
        <p class="text-base-content/60 mb-4">
          It may not be in the loaded dataset — run <code class="font-mono">pnpm seed</code> then{" "}
          <code class="font-mono">pnpm serve</code> in <code class="font-mono">tuxery/catalog</code> for a local
          one.
        </p>
        <a href="/" class="link link-primary">
          Back to search
        </a>
      </div>
    );
  }

  return (
    <div class="flex flex-col gap-10">
      <section class="flex flex-col md:flex-row gap-6 md:items-start">
        <div class="w-20 h-20 rounded-box bg-base-200 flex items-center justify-center shrink-0 overflow-hidden">
          {a.iconUrl ? (
            <img src={a.iconUrl} alt="" width={80} height={80} class="w-full h-full object-cover" />
          ) : (
            <LuPackage class="text-4xl text-base-content/40" />
          )}
        </div>

        <div class="flex-1 min-w-0">
          <h1 class="text-3xl font-bold">{a.name}</h1>
          <p class="text-base-content/70 mt-1">{a.shortDescription}</p>

          <div class="flex flex-wrap gap-2 mt-3">
            {a.developer && <span class="badge badge-ghost">{a.developer}</span>}
            {a.category && <span class="badge badge-outline">{a.category}</span>}
            {a.rating && (
              <span class="badge badge-outline">
                ★ {a.rating.average.toFixed(1)} ({a.rating.count})
              </span>
            )}
            {a.ageRating && (
              <span class="badge badge-outline">
                {a.ageRating.system} {a.ageRating.value}
              </span>
            )}
            {a.aiFeatures && <span class="badge badge-secondary">AI features</span>}
            {a.inAppPurchases && <span class="badge badge-warning">In-app purchases</span>}
          </div>
        </div>

        <div class="flex flex-wrap gap-2 md:flex-col">
          {a.packages.map((pkg) => (
            <a
              key={pkg.source}
              href={pkg.homepage ?? a.homepage ?? "#"}
              class="btn btn-primary btn-sm"
              target="_blank"
              rel="noopener"
            >
              Install via {SOURCE_LABELS[pkg.source]}
            </a>
          ))}
        </div>
      </section>

      {a.screenshots?.length ? (
        <section>
          <h2 class="text-lg font-semibold mb-3">Screenshots</h2>
          <div class="flex gap-3 overflow-x-auto">
            {a.screenshots.map((src) => (
              <img key={src} src={src} alt="" class="h-48 rounded-box shrink-0" />
            ))}
          </div>
        </section>
      ) : null}

      {a.longDescription ? (
        <section>
          <h2 class="text-lg font-semibold mb-2">About</h2>
          <p class="whitespace-pre-line text-base-content/80">{a.longDescription}</p>
        </section>
      ) : null}

      {a.features?.length ? (
        <section>
          <h2 class="text-lg font-semibold mb-2">Features</h2>
          <ul class="list-disc list-inside text-base-content/80">
            {a.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {a.changelog ? (
        <section>
          <h2 class="text-lg font-semibold mb-2">Changelog</h2>
          <p class="whitespace-pre-line text-base-content/80">{a.changelog}</p>
        </section>
      ) : null}

      {a.requirements ? (
        <section>
          <h2 class="text-lg font-semibold mb-2">Required configuration</h2>
          <p class="text-base-content/80">{a.requirements}</p>
        </section>
      ) : null}

      {a.reviews?.length ? (
        <section>
          <h2 class="text-lg font-semibold mb-2">Reviews</h2>
          <ul class="flex flex-col gap-3">
            {a.reviews.map((review) => (
              <li key={review.author} class="border border-base-300 rounded-box p-3">
                <div class="text-sm font-medium">
                  {review.author} — ★ {review.rating}
                </div>
                <p class="text-sm text-base-content/70 mt-1">{review.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 class="text-lg font-semibold mb-2">Additional information</h2>
        <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
          {a.developer && (
            <>
              <dt class="text-base-content/60">Developer</dt>
              <dd>{a.developer}</dd>
            </>
          )}
          {a.publisher && (
            <>
              <dt class="text-base-content/60">Publisher</dt>
              <dd>{a.publisher}</dd>
            </>
          )}
          {a.license && (
            <>
              <dt class="text-base-content/60">License</dt>
              <dd>{a.license}</dd>
            </>
          )}
          {a.languages?.length && (
            <>
              <dt class="text-base-content/60">Languages</dt>
              <dd>{a.languages.join(", ")}</dd>
            </>
          )}
          {a.approxSizeBytes && (
            <>
              <dt class="text-base-content/60">Size</dt>
              <dd>{formatBytes(a.approxSizeBytes)}</dd>
            </>
          )}
          {a.permissions?.length && (
            <>
              <dt class="text-base-content/60">Permissions</dt>
              <dd>{a.permissions.join(", ")}</dd>
            </>
          )}
          {a.gdprCompliant !== undefined && (
            <>
              <dt class="text-base-content/60">GDPR</dt>
              <dd>{a.gdprCompliant ? "Compliant" : "Not stated"}</dd>
            </>
          )}
          {a.homepage && (
            <>
              <dt class="text-base-content/60">Homepage</dt>
              <dd>
                <a href={a.homepage} class="link link-primary" target="_blank" rel="noopener">
                  {a.homepage}
                </a>
              </dd>
            </>
          )}
          <dt class="text-base-content/60">Available via</dt>
          <dd>{a.packages.map((pkg) => SOURCE_LABELS[pkg.source]).join(", ")}</dd>
        </dl>
      </section>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const app = resolveValue(useApp);
  return {
    title: app ? `${app.name} — Tuxery` : "App not found — Tuxery",
    meta: app ? [{ name: "description", content: app.shortDescription }] : [],
  };
};

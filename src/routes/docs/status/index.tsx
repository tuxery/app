import { component$ } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import { getStats } from "~/catalog";
import { resolveServerEnv } from "~/server-env";

export const useStats = routeLoader$(async (requestEvent) =>
  getStats(resolveServerEnv(requestEvent.platform)),
);

export default component$(() => {
  const stats = useStats();

  return (
    <div class="flex flex-col gap-8">
      <div>
        <h1 class="text-3xl font-bold mb-2">Status</h1>
        <p class="text-base-content/70 max-w-2xl">
          Where Tuxery stands right now. See the{" "}
          <a
            href="https://github.com/orgs/tuxery/projects/1"
            class="link link-primary"
            target="_blank"
            rel="noopener"
          >
            Tuxery GitHub Project
          </a>{" "}
          for how this maps to tracked work.
        </p>
      </div>

      <div class="stats stats-vertical sm:stats-horizontal shadow border border-base-300">
        <div class="stat">
          <div class="stat-title">Apps &amp; games catalogued</div>
          <div class="stat-value text-primary">{stats.value.total.toLocaleString()}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Catalog snapshot</div>
          <div class="stat-value text-lg">
            {stats.value.generatedAt ? new Date(stats.value.generatedAt).toLocaleDateString() : "—"}
          </div>
          <div class="stat-desc">Per-app update dates aren't tracked yet</div>
        </div>
      </div>

      <p class="text-base-content/70">
        For the full per-source breakdown — what's implemented, how each one is retrieved — see{" "}
        <a href="/docs/sources/" class="link link-primary">
          Sources
        </a>
        .
      </p>

      <section>
        <h2 class="text-lg font-semibold mb-2">What's next</h2>
        <p class="text-base-content/80">
          Planned work and how it's tracked is on the{" "}
          <a href="/docs/roadmap/" class="link link-primary">
            Roadmap
          </a>{" "}
          page; what already shipped, on the{" "}
          <a href="/docs/changelog/" class="link link-primary">
            Changelog
          </a>
          . Known gaps in each source's data are listed on the{" "}
          <a href="/docs/coverage/" class="link link-primary">
            per-source to-do
          </a>
          .
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">Contribute</h2>
        <p class="text-base-content/80">
          Tuxery is a small, entirely community-run project — there's real work to do, and outside
          help matters most on the data itself and on the site/pipeline code. See{" "}
          <a href="/docs/contribute/" class="link link-primary">
            How to contribute
          </a>{" "}
          for the concrete ways in.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">Sponsoring</h2>
        <p class="text-base-content/80">
          For now, Tuxery runs entirely on free tiers of the tools it uses — that's the right scale
          for a small community project. But some things the community might genuinely want (a
          public API, for instance) would need to go beyond what's free, and that means funding. If
          that ever becomes the right next step, sponsoring will be part of how it happens.
        </p>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Status — Tuxery",
  meta: [
    {
      name: "description",
      content: "Where Tuxery stands: catalog size, what's next, and how to help.",
    },
  ],
};

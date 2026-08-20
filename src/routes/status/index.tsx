import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { getStats } from "~/catalog";

export const useStats = routeLoader$(async () => getStats());

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
        <a href="/sources/" class="link link-primary">
          Sources
        </a>
        .
      </p>

      <section>
        <h2 class="text-lg font-semibold mb-2">Roadmap</h2>
        <ul class="list-disc list-inside text-base-content/80 flex flex-col gap-1">
          <li>More distributions and sources supported.</li>
          <li>A voting system so you can help surface your favorite apps and games.</li>
          <li>
            Real need for help from distro maintainers and contributors to clean up and correct the
            data.
          </li>
          <li>An "influencer" mode for sharing your own discoveries with others.</li>
          <li>A personal space to fine-tune filters and track your installs.</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">Contribute</h2>
        <p class="text-base-content/80">
          Tuxery is a small, entirely community-run project — there's real work to do, and outside
          help matters most on the data itself and on the site/pipeline code. See{" "}
          <a href="/contribute/" class="link link-primary">
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
      content: "Where Tuxery stands: catalog size, the roadmap, and how to help.",
    },
  ],
};

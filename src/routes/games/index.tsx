import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 class="text-3xl font-bold mb-2">Games</h1>
        <p class="text-base-content/70">
          A dedicated, games-only view of the catalog is coming soon.
        </p>
      </div>

      <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
        Tuxery's catalog can now confirm when a package <em>is</em> a game (see the "Games" filter
        on Browse), but a dedicated page with genre browsing, trending, and editorial picks still
        needs the fuller category taxonomy to exist first (tracked on the Tuxery GitHub Project).
      </div>

      <a href="/browse/?type=game" class="link link-primary">
        In the meantime, browse confirmed games
      </a>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Games — Tuxery",
  meta: [
    {
      name: "description",
      content: "Browse Linux games on Tuxery — dedicated games-only browsing is coming soon.",
    },
  ],
};

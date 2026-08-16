import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 class="text-3xl font-bold mb-2">Categories</h1>
        <p class="text-base-content/70">Browsing the catalog by category is coming soon.</p>
      </div>

      <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
        Tuxery doesn't have a defined category taxonomy yet — sources report categories
        inconsistently, if at all, and nothing normalizes them today (tracked on the Tuxery GitHub
        Project). Once that's defined, this page will list every category and let you browse into
        it.
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Categories — Tuxery",
  meta: [
    {
      name: "description",
      content: "Browse the Tuxery catalog by category — coming soon.",
    },
  ],
};

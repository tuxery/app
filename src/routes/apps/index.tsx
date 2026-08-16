import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 class="text-3xl font-bold mb-2">Apps</h1>
        <p class="text-base-content/70">
          A dedicated, apps-only view of the catalog is coming soon.
        </p>
      </div>

      <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
        Tuxery's catalog doesn't distinguish apps from games yet — that classification isn't in the
        data model yet (tracked on the Tuxery GitHub Project). Once it lands, this page will list
        every app, browsable and searchable on its own.
      </div>

      <a href="/browse" class="link link-primary">
        In the meantime, browse the full catalog
      </a>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Apps — Tuxery",
  meta: [
    {
      name: "description",
      content: "Browse Linux apps on Tuxery — dedicated apps-only browsing is coming soon.",
    },
  ],
};

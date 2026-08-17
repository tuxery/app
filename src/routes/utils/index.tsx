import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 class="text-3xl font-bold mb-2">Utils</h1>
        <p class="text-base-content/70">
          A dedicated, CLI-tools-only view of the catalog is coming soon.
        </p>
      </div>

      <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
        Tuxery's catalog can now confirm when a package <em>is</em> a GUI app (see the "GUI apps"
        filter on Browse), but there's still no reliable way to confirm the opposite — most CLI
        tools just don't carry positive evidence either way, so a dedicated, accurate CLI-only
        listing isn't possible yet (tracked on the Tuxery GitHub Project).
      </div>

      <a href="/browse" class="link link-primary">
        In the meantime, browse the full catalog
      </a>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Utils — Tuxery",
  meta: [
    {
      name: "description",
      content: "Browse Linux CLI tools on Tuxery — dedicated CLI-only browsing is coming soon.",
    },
  ],
};

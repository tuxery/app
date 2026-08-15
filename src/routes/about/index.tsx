import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { SOURCE_LABELS } from "~/catalog";

export default component$(() => {
  return (
    <div class="flex flex-col gap-10 max-w-2xl">
      <section>
        <h1 class="text-3xl font-bold mb-3">About Tuxery</h1>
        <p class="text-base-content/80">
          Tuxery is a unified, deduplicated search engine for Linux software. Instead of checking
          Flathub, the Snap Store, AppImageHub and your distro's own repos separately, Tuxery
          merges them into one search: one card per app, no matter how many places it's packaged.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">Philosophy</h2>
        <ul class="list-disc list-inside text-base-content/80 flex flex-col gap-1">
          <li>Distro-agnostic — every supported source is shown side by side, no favorites.</li>
          <li>
            Exhaustive by design — the goal is to cover every real source of Linux software, not
            just the popular ones.
          </li>
          <li>
            No app is installed directly by Tuxery — every install button hands off to the
            official source (Flathub, Snap Store, the upstream release page, ...); Tuxery never
            runs installer code itself.
          </li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">Supported sources</h2>
        <div class="flex flex-wrap gap-2">
          {Object.values(SOURCE_LABELS).map((label) => (
            <span key={label} class="badge badge-outline badge-primary">
              {label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "About — Tuxery",
  meta: [
    {
      name: "description",
      content: "What Tuxery is, its philosophy, and the sources it aggregates.",
    },
  ],
};

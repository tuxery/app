import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { SOURCE_LABELS, type PackageSourceId } from "~/catalog";

interface SourceStatus {
  id: PackageSourceId;
  complete: boolean;
  note: string;
}

// Kept in sync by hand with catalog's docs/sources.md — no cross-repo
// import (separate repos), same convention as catalog.ts itself.
const SOURCE_STATUSES: SourceStatus[] = [
  { id: "flathub", complete: true, note: "canonical catalog, ~3,300 apps" },
  { id: "snapcraft", complete: false, note: "partial category sweep, ~1,500 snaps" },
  { id: "appimage", complete: false, note: "community list, no version numbers yet" },
  { id: "aur", complete: true, note: "full dump, ~117,000 packages" },
  { id: "debian", complete: false, note: "stable/main/amd64 only" },
  { id: "ubuntu", complete: false, note: "main+universe/amd64 only" },
  { id: "fedora", complete: false, note: "one release, x86_64 only" },
  { id: "arch", complete: false, note: "core+extra, amd64 only" },
];

export default component$(() => {
  return (
    <div class="flex flex-col gap-10 max-w-2xl">
      <section>
        <h1 class="text-3xl font-bold mb-3">About Tuxery</h1>
        <p class="text-base-content/80">
          Tuxery's goal is simple, if a little ambitious: list every piece of Linux software and
          every Linux game that exists, across every distribution, every source, and every
          packaging format. You won't be able to install all of it on your particular setup —
          that's fine. At least you'll know it's out there. Down the road, we'd also like to make
          it easy for creators and users to talk to each other, so asking a project to support
          your platform becomes a real conversation instead of a wish into the void.
        </p>
        <p class="text-base-content/80 mt-3">
          Under the hood, Tuxery pulls listings from Flathub, the Snap Store, AppImageHub, and the
          native package repositories of major distributions, then automatically matches the same
          app across all of them into a single card — so an app shows up once, not four times.
          Every "Install" button hands off straight to the official source; Tuxery itself never
          runs installer code or hosts a package.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">Philosophy</h2>
        <ul class="list-disc list-inside text-base-content/80 flex flex-col gap-1">
          <li>Distro-agnostic, always — every source sits side by side, nobody gets top billing.</li>
          <li>
            Exhaustive is the whole point — we'd rather cover every real source of Linux software
            than just curate the popular ones.
          </li>
          <li>
            Nothing installs through us — every button hands off to the real source (Flathub, the
            Snap Store, an upstream release page, ...); we never run installer code ourselves.
          </li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">Roadmap</h2>
        <ul class="list-disc list-inside text-base-content/80 flex flex-col gap-1">
          <li>More distributions and sources supported.</li>
          <li>A voting system so you can help surface your favorite apps and games.</li>
          <li>
            Real need for help from distro maintainers and contributors to clean up and correct
            the data.
          </li>
          <li>An "influencer" mode for sharing your own discoveries with others.</li>
          <li>A personal space to fine-tune filters and track your installs.</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">Supported sources</h2>
        <ul class="columns-1 sm:columns-2 gap-x-8 text-base-content/80">
          {SOURCE_STATUSES.map(({ id, complete, note }) => (
            <li key={id} class="flex items-start gap-2 mb-1.5 break-inside-avoid">
              <span class={["badge badge-sm shrink-0 mt-0.5", complete ? "badge-success" : "badge-warning"]}>
                {complete ? "complete" : "partial"}
              </span>
              <span>
                <span class="font-medium text-base-content">{SOURCE_LABELS[id]}</span>
                {note && <span class="text-base-content/60">: {note}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "About — Tuxery",
  meta: [
    {
      name: "description",
      content: "What Tuxery is, its philosophy, the sources it aggregates, and what's coming next.",
    },
  ],
};

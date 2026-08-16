import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

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
        <p class="text-base-content/70 mt-3">
          For the full source-by-source breakdown, the roadmap, and how to help, see the{" "}
          <a href="/status/" class="link link-primary">
            Status
          </a>{" "}
          page.
        </p>
      </section>

      <section>
        <p class="text-base-content/70">
          Tuxery is licensed{" "}
          <a href="/license/" class="link link-primary">
            AGPL-3.0-or-later
          </a>
          .
        </p>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "About — Tuxery",
  meta: [
    {
      name: "description",
      content: "What Tuxery is, how it works, and the philosophy behind it.",
    },
  ],
};

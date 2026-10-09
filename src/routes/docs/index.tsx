import { component$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { TuxeryLogo } from "~/components/tuxery-logo/tuxery-logo";

export default component$(() => {
  return (
    <div class="flex flex-col gap-10 max-w-2xl">
      <section>
        <div class="flex justify-center mb-6">
          <TuxeryLogo size={96} cutoutColor="var(--color-base-100)" />
        </div>
        <h1 class="text-3xl font-bold mb-3">About Tuxery</h1>
        <p class="text-base-content/80">
          Tuxery's goal is simple, if a little ambitious: list every piece of Linux software and
          every Linux game that exists, across every distribution, every source, and every packaging
          format. You won't be able to install all of it on your particular setup — that's fine. At
          least you'll know it's out there. Down the road, we'd also like to make it easy for
          creators and users to talk to each other, so asking a project to support your platform
          becomes a real conversation instead of a wish into the void.
        </p>
        <p class="text-base-content/80 mt-3">
          Under the hood, Tuxery pulls listings from Flathub, the Snap Store, the AppImage community
          feed, game storefronts, vendor repositories and the native package repositories of some
          twenty distributions, then automatically matches the same app across all of them into a
          single card — so an app shows up once, not twenty times. Every "Install" button hands off
          straight to the official source; Tuxery itself never runs installer code or hosts a
          package.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">Philosophy</h2>
        <ul class="list-disc list-inside text-base-content/80 flex flex-col gap-1">
          <li>
            Distro-agnostic, always — every source sits side by side, nobody gets top billing.
          </li>
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
          How we treat the data is spelled out in the{" "}
          <a href="/docs/philosophy/" class="link link-primary">
            data philosophy
          </a>
          , and how dozens of sources become one card per app in{" "}
          <a href="/docs/merging/" class="link link-primary">
            how sources are merged
          </a>
          .
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">Where to go next</h2>
        <ul class="list-disc list-inside text-base-content/80 flex flex-col gap-1">
          <li>
            New to Linux apps?{" "}
            <a href="/docs/formats/" class="link link-primary">
              Which format to choose
            </a>{" "}
            and the{" "}
            <a href="/docs/glossary/" class="link link-primary">
              glossary
            </a>
            .
          </li>
          <li>
            Where the project stands:{" "}
            <a href="/docs/status/" class="link link-primary">
              status
            </a>
            ,{" "}
            <a href="/docs/roadmap/" class="link link-primary">
              roadmap
            </a>{" "}
            and{" "}
            <a href="/docs/changelog/" class="link link-primary">
              changelog
            </a>
            .
          </li>
          <li>
            Something missing or wrong? The{" "}
            <a href="/docs/faq/" class="link link-primary">
              FAQ
            </a>{" "}
            and{" "}
            <a href="/docs/contribute/" class="link link-primary">
              how to contribute
            </a>
            .
          </li>
        </ul>
      </section>

      <section>
        <p class="text-base-content/70">
          Tuxery is licensed{" "}
          <a href="/docs/license/" class="link link-primary">
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

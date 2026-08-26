import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuMegaphone } from "@qwikest/icons/lucide";

export default component$(() => {
  return (
    <div class="flex flex-col gap-8 max-w-2xl">
      <div>
        <LuMegaphone class="text-3xl text-primary mb-2" />
        <h1 class="text-3xl font-bold mb-2">Sharing your picks</h1>
        <p class="text-base-content/70">
          An "influencer mode" for sharing your own discoveries with others is on the{" "}
          <a
            href="https://github.com/orgs/tuxery/projects/1"
            class="link link-primary"
            target="_blank"
            rel="noopener"
          >
            Tuxery roadmap
          </a>{" "}
          — not built yet, but planned. See{" "}
          <a href="/creators/baxyz/" class="link link-primary">
            baxyz's page
          </a>{" "}
          for what one looks like today (hand-edited, no authoring UI).
        </p>
      </div>

      <p class="text-base-content/70">
        Any help or support getting there is welcome — see{" "}
        <a href="/contribute/" class="link link-primary">
          How to contribute
        </a>{" "}
        for what that can look like right now.
      </p>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Sharing your picks — Tuxery",
  meta: [
    {
      name: "description",
      content: "Influencer mode is on the Tuxery roadmap — how to help get it built.",
    },
  ],
};

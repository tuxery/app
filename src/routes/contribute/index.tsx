import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuCode, LuFlag, LuGithub, LuPackage } from "@qwikest/icons/lucide";

const WAYS = [
  {
    icon: LuFlag,
    title: "Report bad data",
    body: "Wrong merge, missing app, stale info — open an issue on the catalog repo with the app's id (visible on its detail page) and what looks wrong.",
    href: "https://github.com/tuxery/catalog/issues/new",
    cta: "Open an issue",
  },
  {
    icon: LuCode,
    title: "Contribute code",
    body: 'Tuxery is open source across both the catalog pipeline and this site. Issues tagged "help wanted" are a good place to start.',
    href: "https://github.com/tuxery",
    cta: "Browse the repos",
  },
  {
    icon: LuPackage,
    title: "Improve source coverage",
    body: "Know a Linux app store, repo, or distro Tuxery doesn't cover yet? Propose it as a new source on the catalog repo.",
    href: "https://github.com/tuxery/catalog/issues/new",
    cta: "Propose a source",
  },
];

export default component$(() => {
  return (
    <div class="flex flex-col gap-10 max-w-2xl">
      <div>
        <h1 class="text-3xl font-bold mb-2">How to contribute</h1>
        <p class="text-base-content/70">
          Tuxery is a small, open project. Here's what you can actually do today — see{" "}
          <a href="/about/" class="link link-primary">
            About
          </a>{" "}
          for the philosophy behind it.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        {WAYS.map((way) => (
          <a
            key={way.title}
            href={way.href}
            target="_blank"
            rel="noopener"
            aria-label={`${way.title}: ${way.cta}`}
            class="card bg-base-100 border border-base-300 hover:border-primary/40 hover:shadow-md transition-shadow"
          >
            <div class="card-body">
              <way.icon class="text-2xl text-primary mb-1" />
              <h2 class="card-title text-base">{way.title}</h2>
              <p class="text-sm text-base-content/70">{way.body}</p>
              <span class="text-sm text-primary mt-2">{way.cta} →</span>
            </div>
          </a>
        ))}
      </div>

      <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/60">
        A few forms of contribution are planned but don't exist yet: an in-app "propose a merge" /
        "flag a match" flow, an app/game submission form, and a developer claim-a-page flow. Until
        those ship, GitHub issues are the way in for all of it.
      </div>

      <a
        href="https://github.com/tuxery"
        target="_blank"
        rel="noopener"
        class="btn btn-outline self-start gap-2"
      >
        <LuGithub class="text-lg" />
        Tuxery on GitHub
      </a>
    </div>
  );
});

export const head: DocumentHead = {
  title: "How to contribute — Tuxery",
  meta: [
    {
      name: "description",
      content:
        "How to get involved with Tuxery — report data issues, contribute code, propose sources.",
    },
  ],
};

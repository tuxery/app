import { component$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import {
  LuBug,
  LuCode,
  LuFlag,
  LuGithub,
  LuHeartHandshake,
  LuListTodo,
  LuPackagePlus,
  LuSprout,
} from "@qwikest/icons/lucide";
import {
  labelledIssuesUrl,
  reportDataProblemUrl,
  reportWebsiteProblemUrl,
  requestAdditionUrl,
} from "~/contribute-links";

// No payment processor (GitHub Sponsors, Open Collective, ...) is set up
// yet — direct email is the only channel until one is. Kept as a named
// constant since it's the kind of thing likely to get reused (footer,
// About) once financial support is a real, non-manual flow.
const SPONSOR_EMAIL = "sponsoring@tuxery.store";

interface Way {
  icon: typeof LuFlag;
  title: string;
  body: string;
  href: string;
  cta: string;
}

// Every link opens the right GitHub form already filled in where it can
// be (see `~/contribute-links`), so nobody has to work out which repo or
// template a report belongs to.
const GROUPS: { title: string; intro?: string; ways: Way[] }[] = [
  {
    title: "Tell us what's wrong or missing",
    intro:
      "The most useful help there is, and it takes a minute: each link opens a short form on GitHub (a free account is needed).",
    ways: [
      {
        icon: LuFlag,
        title: "Report bad data",
        body: 'Wrong merge, wrong category, outdated info, an app shown twice. Quicker from the app\'s own page: its "Report this app" link fills in which app.',
        href: reportDataProblemUrl(),
        cta: "Report a data problem",
      },
      {
        icon: LuPackagePlus,
        title: "Suggest an app, source or distro",
        body: "An app Tuxery doesn't list, or a store, repository or distribution it doesn't read yet.",
        href: requestAdditionUrl(),
        cta: "Suggest an addition",
      },
      {
        icon: LuBug,
        title: "Report a website problem",
        body: "A page that breaks, something confusing, or hard to use with a keyboard, screen reader or zoom.",
        href: reportWebsiteProblemUrl(),
        cta: "Report a website problem",
      },
    ],
  },
  {
    title: "Help build it",
    intro: "Tuxery is open source: the data pipeline and this site alike.",
    ways: [
      {
        icon: LuSprout,
        title: "Start with a small task",
        body: 'Issues labelled "good first issue" are scoped for a first contribution.',
        href: labelledIssuesUrl("good first issue"),
        cta: "See good first issues",
      },
      {
        icon: LuListTodo,
        title: "Improve one source",
        body: "Each known gap in a source's data (a beta branch not fetched, a weak filter, a stable release not connected) is its own issue, labelled with its source.",
        href: "/docs/coverage/",
        cta: "See the per-source to-do",
      },
      {
        icon: LuCode,
        title: "Contribute code",
        body: 'Source connectors and data curation live in tuxery/catalog, the website in tuxery/app. Issues labelled "help wanted" are open for anyone to take.',
        href: labelledIssuesUrl("help wanted"),
        cta: "See help-wanted issues",
      },
    ],
  },
  {
    title: "Support the project",
    ways: [
      {
        icon: LuHeartHandshake,
        title: "Support financially",
        body: "No sponsorship platform is set up yet — for now, reach out directly and we'll figure it out.",
        href: `mailto:${SPONSOR_EMAIL}`,
        cta: SPONSOR_EMAIL,
      },
    ],
  },
];

export default component$(() => {
  return (
    <div class="flex flex-col gap-10 max-w-2xl">
      <div>
        <h1 class="text-3xl font-bold mb-2">How to contribute</h1>
        <p class="text-base-content/70">
          Tuxery is a small, open project. Here's what you can actually do today — see{" "}
          <a href="/docs/" class="link link-primary">
            About
          </a>{" "}
          for the philosophy behind it.
        </p>
      </div>

      {GROUPS.map((group) => (
        <section key={group.title} class="flex flex-col gap-3">
          <h2 class="text-lg font-semibold">{group.title}</h2>
          {group.intro && <p class="text-sm text-base-content/70 -mt-1">{group.intro}</p>}
          <div class="grid gap-4 sm:grid-cols-2">
            {group.ways.map((way) => {
              // Only links leaving the site open a new tab.
              const external = !way.href.startsWith("/");
              return (
                // The title is the link, stretched over the whole card, so
                // its accessible name is the title rather than all the text.
                <div
                  key={way.title}
                  class="card relative bg-base-100 border border-base-300 hover:border-primary/40 hover:shadow-md transition-shadow"
                >
                  <div class="card-body">
                    <way.icon class="text-2xl text-primary mb-1" />
                    <h3 class="card-title text-base">
                      <a
                        href={way.href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener" : undefined}
                        class="after:absolute after:inset-0 after:rounded-box focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-base-content"
                      >
                        {way.title}
                      </a>
                    </h3>
                    <p class="text-sm text-base-content/70">{way.body}</p>
                    <span class="text-sm text-primary mt-2" aria-hidden="true">
                      {way.cta} →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/70">
        A few forms of contribution are planned but don't exist yet: an in-app "propose a merge" /
        "flag a match" flow, an app/game submission form, and a developer claim-a-page flow. Until
        those ship, the GitHub forms above are the way in for all of it.
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
        "How to get involved with Tuxery — report data or website problems, suggest apps and sources, contribute code.",
    },
  ],
};

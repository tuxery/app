import { component$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { CHANGELOG } from "~/data/changelog";

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const HISTORY = [
  { label: "site", href: "https://github.com/tuxery/app/commits/main" },
  { label: "data pipeline", href: "https://github.com/tuxery/catalog/commits/main" },
];

export default component$(() => (
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-2">
      <h1 class="text-3xl font-bold">Changelog</h1>
      <p class="text-base-content/70">
        What changed on the site and in the data, month by month. Version numbers for the site and
        the catalog are coming; until then, every change is in the commit history of the{" "}
        {HISTORY.map((repo, index) => (
          <span key={repo.href}>
            {index > 0 && " and the "}
            <a href={repo.href} target="_blank" rel="noopener" class="link link-primary">
              {repo.label}
            </a>
          </span>
        ))}
        .
      </p>
    </div>

    {CHANGELOG.map((entry) => (
      <section key={entry.month} class="flex flex-col gap-3">
        <h2 class="text-xl font-semibold" id={entry.month}>
          {monthLabel(entry.month)}
        </h2>
        <div class="grid gap-6 md:grid-cols-2">
          {(
            [
              ["On the site", entry.site],
              ["In the data", entry.data],
            ] as const
          ).map(([title, items]) => (
            <div key={title}>
              <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/60 mb-2">
                {title}
              </h3>
              <ul class="list-disc pl-5 text-base-content/80 flex flex-col gap-1.5">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    ))}
  </div>
));

export const head: DocumentHead = {
  title: "Changelog — Tuxery",
  meta: [
    {
      name: "description",
      content: "What changed on Tuxery's site and in its data, month by month.",
    },
  ],
};

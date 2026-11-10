import { component$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { GAP_REASONS, SOURCE_GAPS, todoGaps, type GapReason } from "~/data/source-gaps";

const REASON_BADGE: Record<GapReason, string> = {
  refused: "badge-error",
  "not-published": "badge-ghost",
  waiting: "badge-warning",
  todo: "badge-success",
  "kept-private": "badge-neutral",
};

export default component$(() => {
  const todos = todoGaps();
  return (
    <div class="flex flex-col gap-8">
      <div>
        <h1 class="text-3xl font-bold mb-2">What each source is missing</h1>
        <p class="text-base-content/70">
          Some details never make it to Tuxery: a source doesn't publish them, asked us not to
          collect them, or nobody has built them yet. Here is what's missing, source by source, and
          why — and where each source's maintainers stand on our use of their data. How each source
          is read is on{" "}
          <a href="/docs/sources/" class="link link-primary">
            Sources
          </a>
          .
        </p>
      </div>

      <section>
        <h2 class="text-lg font-semibold mb-3">Why something is missing</h2>
        <dl class="grid gap-2 sm:grid-cols-2 text-sm">
          {(Object.keys(GAP_REASONS) as GapReason[]).map((reason) => (
            <div key={reason} class="flex flex-col gap-1">
              <dt>
                <span class={["badge badge-sm", REASON_BADGE[reason]]}>
                  {GAP_REASONS[reason].label}
                </span>
              </dt>
              <dd class="text-base-content/70">{GAP_REASONS[reason].description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold">By source</h2>
        {SOURCE_GAPS.map((entry) => (
          <div
            key={entry.id}
            id={entry.id}
            class="card bg-base-100 border border-base-300 scroll-mt-20"
          >
            <div class="card-body p-5 gap-2">
              <h3 class="card-title text-base">{entry.label}</h3>
              <p class="text-sm text-base-content/70">
                <span class="font-medium text-base-content">Permission:</span> {entry.permission}
              </p>
              {entry.gaps.length === 0 ? (
                <p class="text-sm text-base-content/70">Nothing known to be missing.</p>
              ) : (
                <ul class="flex flex-col gap-2 text-sm">
                  {entry.gaps.map((gap) => (
                    <li key={gap.what} class="flex flex-col gap-0.5">
                      <span class="flex flex-wrap items-center gap-2">
                        <span class="font-medium">{gap.what}</span>
                        <span class={["badge badge-sm", REASON_BADGE[gap.reason]]}>
                          {GAP_REASONS[gap.reason].label}
                        </span>
                      </span>
                      <span class="text-base-content/70">{gap.note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        <p class="text-sm text-base-content/70">
          Sources not listed here have nothing known to be missing, and haven't been asked about our
          use of their data yet.
        </p>
      </section>

      <section id="not-built-yet" class="scroll-mt-20">
        <h2 class="text-lg font-semibold mb-1">Not built yet</h2>
        <p class="text-sm text-base-content/70 mb-3">
          Allowed and available, only waiting for someone to build them. See{" "}
          <a href="/docs/contribute/" class="link link-primary">
            How to contribute
          </a>{" "}
          to pick one up.
        </p>
        <ul class="list-disc list-inside text-sm text-base-content/80">
          {todos.map(({ source, gap }) => (
            <li key={`${source}:${gap.what}`}>
              <span class="font-medium">{source}:</span> {gap.what}. {gap.note}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "What each source is missing — Tuxery",
  meta: [
    {
      name: "description",
      content:
        "What Tuxery can't show from each source, and why: not published, refused by the source, waiting on it, or not built yet.",
    },
  ],
};

import { component$ } from "@qwik.dev/core";

const STAGES = [
  { name: "Fetch", detail: "~30 stores, distros and vendor repos", figure: "600k+ packages" },
  { name: "Filter", detail: "drop libraries, fonts, docs, test packages", figure: "" },
  { name: "Match", detail: "group packages of the same app", figure: "" },
  { name: "Enrich", detail: "categories, icons, ratings, editions, add-ons", figure: "" },
  { name: "Publish", detail: "one card per app", figure: "~100k apps" },
];

/**
 * The catalog pipeline as five steps — the diagram of the docs' "how
 * sources are merged" page (an MDX page, which imports it). An ordered
 * list, so a screen reader reads it as the sequence it is; arrows are
 * decoration. `!` utilities override `.docs-prose`'s own list styles.
 * Horizontal from `md` up, stacked on a phone.
 */
export const MergePipeline = component$(() => (
  <figure class="my-6">
    <ol class="list-none! pl-0! my-0! flex flex-col md:flex-row gap-2 md:gap-0 md:items-stretch">
      {STAGES.map((stage, index) => (
        <li key={stage.name} class="mt-0! flex flex-col md:flex-row md:flex-1 items-center">
          <div class="w-full h-full rounded-box border border-base-300 bg-base-100 p-3 text-center flex flex-col gap-1">
            <span class="text-xs text-base-content/70">Step {index + 1}</span>
            <span class="font-semibold text-base-content">{stage.name}</span>
            <span class="text-xs text-base-content/70 leading-snug">{stage.detail}</span>
            {stage.figure && <span class="text-xs font-medium text-primary">{stage.figure}</span>}
          </div>
          {index < STAGES.length - 1 && (
            <span aria-hidden="true" class="text-base-content/70 px-1 md:rotate-0 rotate-90">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
    <figcaption class="text-xs text-base-content/70 text-center mt-2">
      The catalog pipeline, rerun each time sources are refreshed.
    </figcaption>
  </figure>
));

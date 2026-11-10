import { component$ } from "@qwik.dev/core";
import { routeLoader$, type DocumentHead } from "@qwik.dev/router";
import { getSourceCounts, getSourceTerms } from "~/catalog";
import { SOURCE_LABELS, type PackageSourceId } from "~/catalog-types";
import { PERMISSION_CLASS, StatusChip } from "~/components/status-chip/status-chip";
import { cellOf, FIELDS, PERMISSIONS, SOURCE_ROWS, type Field } from "~/data/source-gaps";
import { METHODS } from "~/data/source-methods";
import { hasStorePage } from "~/data/store-pages";
import { resolveServerEnv } from "~/server-env";
import {
  FETCH_LABELS,
  recordsFor,
  STORAGE_LABELS,
  VERDICT_LABELS,
  type SourceTermsRecord,
} from "~/source-terms";

// One page per source: how Tuxery reads it, what it gets from it, where the
// data is kept, and the source's terms as we apply them. The terms come from
// catalog's config/source-terms.json (published as the `sourceTerms` meta
// row), the rest from the same hand-kept data as /docs/sources/ and
// /docs/source-gaps/, so the three pages can't disagree.

function isSource(id: string): id is PackageSourceId {
  return Object.hasOwn(METHODS, id);
}

export const useSourcePage = routeLoader$(async (requestEvent) => {
  const id = requestEvent.params.id ?? "";
  if (!isSource(id)) {
    requestEvent.status(404);
    return null;
  }
  const env = resolveServerEnv(requestEvent.platform);
  const [terms, counts] = await Promise.all([getSourceTerms(env), getSourceCounts(env)]);
  return {
    id,
    records: terms ? recordsFor(terms, id) : [],
    checkedOn: terms?.checkedOn,
    disclaimer: terms?.disclaimer,
    count: counts[id],
  };
});

const FIELD_KEYS = Object.keys(FIELDS) as Field[];

const TermsRecord = component$<{ id: string; record: SourceTermsRecord; titled: boolean }>(
  ({ id, record, titled }) => (
    <div class="flex flex-col gap-3">
      {titled && <h3 class="font-semibold font-mono text-sm">{id}</h3>}
      <dl class="grid gap-x-6 gap-y-2 sm:grid-cols-[12rem_1fr] text-sm">
        <dt class="font-medium">Our reading</dt>
        <dd class="text-base-content/80">{VERDICT_LABELS[record.verdict] ?? record.verdict}</dd>
        <dt class="font-medium">Reading it automatically</dt>
        <dd class="text-base-content/80">
          {FETCH_LABELS[record.automatedFetch] ?? record.automatedFetch}
        </dd>
        <dt class="font-medium">Where the data is kept</dt>
        <dd class="text-base-content/80">
          {STORAGE_LABELS[record.publicStorage] ?? record.publicStorage}
        </dd>
        <dt class="font-medium">License of the data</dt>
        <dd class="text-base-content/80">{record.fieldLicense}</dd>
        {record.attribution && (
          <>
            <dt class="font-medium">Credit we owe</dt>
            <dd class="text-base-content/80">{record.attribution}</dd>
          </>
        )}
        {record.note && (
          <>
            <dt class="font-medium">Note</dt>
            <dd class="text-base-content/80">{record.note}</dd>
          </>
        )}
      </dl>
      <div>
        <h4 class="text-sm font-medium mb-2">What we read to decide</h4>
        <ul class="flex flex-col gap-2 text-sm">
          {record.evidence.map((evidence) => (
            <li key={evidence.url + evidence.finding} class="flex flex-col gap-0.5">
              <a
                href={evidence.url}
                class="link link-primary break-all"
                target="_blank"
                rel="noopener"
              >
                {evidence.url}
              </a>
              <span class="text-base-content/70">
                {evidence.read ? "" : "Not read (blocked or missing): "}
                {evidence.finding}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  ),
);

export default component$(() => {
  const data = useSourcePage();
  if (!data.value) {
    return (
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold">Source not found</h1>
        <p class="text-base-content/70">
          See{" "}
          <a href="/docs/sources/" class="link link-primary">
            every source
          </a>
          .
        </p>
      </div>
    );
  }
  const { id, records, checkedOn, disclaimer, count } = data.value;
  const row = SOURCE_ROWS.find((r) => r.id === id);

  return (
    <div class="flex flex-col gap-8">
      <div>
        <p class="text-sm mb-1">
          <a href="/docs/sources/" class="link link-hover text-base-content/70">
            ← Sources
          </a>
        </p>
        <h1 class="text-3xl font-bold mb-2">{SOURCE_LABELS[id]}</h1>
        <p class="text-base-content/70">
          How Tuxery reads {SOURCE_LABELS[id]}, what it gets from it, where that data is kept, and
          the source's terms as we apply them.
        </p>
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
          <a href={`/browse/?source=${encodeURIComponent(id)}`} class="link link-primary">
            {count === undefined
              ? "Browse this source →"
              : `Browse its ${count.toLocaleString("en")} apps →`}
          </a>
          {hasStorePage(id) && (
            <a href={`/sources/${id}/`} class="link link-primary">
              Store page →
            </a>
          )}
        </div>
      </div>

      <section>
        <h2 class="text-lg font-semibold mb-2">How we read it</h2>
        <p class="text-base-content/80">{METHODS[id]}</p>
        <p class="text-sm text-base-content/70 mt-2">
          Every request says who we are, with the User-Agent{" "}
          <code class="text-xs">tuxery-catalog (+https://github.com/tuxery/catalog)</code>.
        </p>
      </section>

      {row && (
        <section>
          <h2 class="text-lg font-semibold mb-2">What we get from it</h2>
          <ul class="grid gap-2 sm:grid-cols-2 text-sm">
            {FIELD_KEYS.map((field) => (
              <li key={field} class="flex items-center gap-2">
                <StatusChip status={cellOf(row, field)} />
                <span>{FIELDS[field].long}</span>
              </li>
            ))}
          </ul>
          <p class="text-sm text-base-content/70 mt-3 flex flex-wrap items-center gap-2">
            Its maintainers on our use:{" "}
            <span class={["badge badge-sm", PERMISSION_CLASS[row.permission]]}>
              {PERMISSIONS[row.permission]}
            </span>
            {row.permissionNote}
          </p>
          {row.notes?.length ? (
            <ul class="flex flex-col gap-2 text-sm mt-3">
              {row.notes.map((note) => (
                <li key={note.what} class="flex gap-2">
                  <StatusChip status={note.availability} />
                  <span>
                    <span class="font-medium">{note.what}.</span>{" "}
                    <span class="text-base-content/70">{note.note}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <p class="text-sm text-base-content/70 mt-3">
            Every source side by side:{" "}
            <a href="/docs/source-gaps/" class="link link-primary">
              What each source is missing
            </a>
            .
          </p>
        </section>
      )}

      <section class="flex flex-col gap-4">
        <div>
          <h2 class="text-lg font-semibold mb-1">Its terms, as we apply them</h2>
          <p class="text-sm text-base-content/70">
            {checkedOn ? `Checked on ${checkedOn}, updated as answers come in. ` : ""}
            Our own reading, not legal advice and not the source's word: the terms we follow, as we
            understand them. Tuxery's AGPL license covers our code, not the source's data.
          </p>
        </div>
        {records.length === 0 ? (
          <p class="text-sm text-base-content/70">
            Not available right now: the record comes with each catalog publish.
          </p>
        ) : (
          records.map(({ id: recordId, record }) => (
            <TermsRecord key={recordId} id={recordId} record={record} titled={records.length > 1} />
          ))
        )}
        {disclaimer && <p class="text-xs text-base-content/60">{disclaimer}</p>}
      </section>

      <div class="border border-base-300 rounded-box p-6 text-sm text-base-content/70">
        Maintain this source and want something changed, corrected or removed? See{" "}
        <a href="/docs/contribute/" class="link link-primary">
          How to contribute
        </a>
        , or open an issue on{" "}
        <a href="https://github.com/tuxery/catalog/issues" class="link link-primary">
          tuxery/catalog
        </a>
        : we answer, and remove a source's data on request.
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useSourcePage);
  const label = data ? SOURCE_LABELS[data.id] : undefined;
  return {
    title: label ? `${label} as a source — Tuxery` : "Source not found — Tuxery",
    meta: label
      ? [
          {
            name: "description",
            content: `How Tuxery reads ${label}, what it gets from it, where that data is kept, and its terms as we apply them.`,
          },
        ]
      : [],
  };
};

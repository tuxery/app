import { component$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { SOURCE_LABELS } from "~/catalog-types";
import { PERMISSION_CLASS, StatusChip } from "~/components/status-chip/status-chip";
import {
  AVAILABILITY,
  cellOf,
  FIELDS,
  PERMISSIONS,
  SOURCE_ROWS,
  todoNotes,
  type Availability,
  type Field,
} from "~/data/source-gaps";

const FIELD_KEYS = Object.keys(FIELDS) as Field[];

export default component$(() => {
  const todos = todoNotes();
  const withNotes = SOURCE_ROWS.filter((row) => row.notes?.length || row.permissionNote);

  return (
    <div class="flex flex-col gap-8">
      <div>
        <h1 class="text-3xl font-bold mb-2">What each source is missing</h1>
        <p class="text-base-content/70">
          What Tuxery gets from each source, detail by detail, and why a detail is missing when it
          is: the source doesn't publish it, asked us not to collect it, or nobody has built it yet.
          The last column says where each source's maintainers stand on our use of their data. How
          each source is read is on{" "}
          <a href="/docs/sources/" class="link link-primary">
            Sources
          </a>
          .
        </p>
      </div>

      <section aria-labelledby="legend">
        <h2 id="legend" class="sr-only">
          Legend
        </h2>
        <ul class="grid gap-x-6 gap-y-2 sm:grid-cols-2 text-sm">
          {(Object.keys(AVAILABILITY) as Availability[]).map((status) => (
            <li key={status} class="flex items-start gap-2">
              <StatusChip status={status} />
              <span>
                <span class="font-medium">{AVAILABILITY[status].label}</span>
                <span class="text-base-content/70"> — {AVAILABILITY[status].description}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="by-source">
        <h2 id="by-source" class="text-lg font-semibold mb-3">
          By source
        </h2>
        <div class="overflow-x-auto border border-base-300 rounded-box">
          <table class="table table-xs sm:table-sm">
            <thead>
              <tr>
                <th class="bg-base-200 sticky left-0 z-10">Source</th>
                {FIELD_KEYS.map((field) => (
                  <th
                    key={field}
                    class="bg-base-200 text-center whitespace-nowrap px-1"
                    title={FIELDS[field].long}
                  >
                    {FIELDS[field].short}
                  </th>
                ))}
                <th class="bg-base-200 whitespace-nowrap">Permission</th>
              </tr>
            </thead>
            <tbody>
              {SOURCE_ROWS.map((row) => (
                <tr key={row.id} class="hover:bg-base-200/50">
                  <th class="bg-base-100 font-medium whitespace-nowrap sticky left-0 z-10">
                    {row.notes?.length || row.permissionNote ? (
                      <a href={`#${row.id}`} class="link link-hover">
                        {SOURCE_LABELS[row.id]}
                      </a>
                    ) : (
                      SOURCE_LABELS[row.id]
                    )}
                  </th>
                  {FIELD_KEYS.map((field) => (
                    <td key={field} class="text-center px-1">
                      <StatusChip status={cellOf(row, field)} />
                    </td>
                  ))}
                  <td>
                    <span
                      class={["badge badge-sm whitespace-nowrap", PERMISSION_CLASS[row.permission]]}
                    >
                      {PERMISSIONS[row.permission]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p class="text-xs text-base-content/60 mt-2">
          Columns:{" "}
          {FIELD_KEYS.map((field, i) => (
            <span key={field}>
              <span class="font-medium">{FIELDS[field].short}</span>,{" "}
              {FIELDS[field].long.toLowerCase()}
              {i < FIELD_KEYS.length - 1 ? "; " : ". "}
            </span>
          ))}
          A distribution's row includes the AppStream metadata it publishes next to its package
          index (icons, screenshots, descriptions). Ratings come from GNOME's ODRS for Flathub and
          AppCenter apps, and from GOG for its games.
        </p>
      </section>

      <section aria-labelledby="notes" class="flex flex-col gap-3">
        <h2 id="notes" class="text-lg font-semibold">
          Notes
        </h2>
        <div class="grid gap-3 md:grid-cols-2">
          {withNotes.map((row) => (
            <div
              key={row.id}
              id={row.id}
              class="card bg-base-100 border border-base-300 scroll-mt-20"
            >
              <div class="card-body p-5 gap-3">
                <h3 class="card-title text-base flex-wrap">
                  {SOURCE_LABELS[row.id]}
                  <span class={["badge badge-sm", PERMISSION_CLASS[row.permission]]}>
                    {PERMISSIONS[row.permission]}
                  </span>
                </h3>
                {row.permissionNote && (
                  <p class="text-sm text-base-content/70">{row.permissionNote}</p>
                )}
                <ul class="flex flex-col gap-2 text-sm">
                  {(row.notes ?? []).map((note) => (
                    <li key={note.what} class="flex gap-2">
                      <StatusChip status={note.availability} />
                      <span>
                        <span class="font-medium">{note.what}.</span>{" "}
                        <span class="text-base-content/70">{note.note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="not-built-yet" aria-labelledby="todo-heading" class="scroll-mt-20">
        <h2 id="todo-heading" class="text-lg font-semibold mb-1">
          Not built yet
        </h2>
        {todos.length === 0 ? (
          <p class="text-sm text-base-content/70">
            Nothing listed right now: every detail marked available above is collected. Know a
            source that publishes more than Tuxery shows?{" "}
            <a href="/docs/contribute/" class="link link-primary">
              Tell us
            </a>
            .
          </p>
        ) : (
          <ul class="list-disc list-inside text-sm text-base-content/80">
            {todos.map(({ id, note }) => (
              <li key={`${id}:${note.what}`}>
                <span class="font-medium">{SOURCE_LABELS[id]}:</span> {note.what}. {note.note}
              </li>
            ))}
          </ul>
        )}
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
        "What Tuxery gets from each source, detail by detail, why a detail is missing, and where each source's maintainers stand on our use of their data.",
    },
  ],
};

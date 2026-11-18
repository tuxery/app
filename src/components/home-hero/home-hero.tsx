import { component$ } from "@qwik.dev/core";
import { LuSearch } from "@qwikest/icons/lucide";
import { OsLine } from "~/components/os-line/os-line";
import { SEARCH_MIN_WORD_LENGTH } from "~/search-fts";

/**
 * The top of the homepage, kept to a slim band so the featured entry and
 * the charts start right below it: the title, the search (the catalog's
 * size in its placeholder) and the OS line.
 */
export const HomeHero = component$<{ total: number }>(({ total }) => (
  <section class="rounded-box bg-base-200/60 border border-base-300 px-4 py-4 sm:px-6">
    <div class="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
      <h1 class="text-2xl font-bold shrink-0">
        Search <span class="text-primary">every</span> Linux app.
      </h1>
      <form action="/browse" method="get" class="flex-1">
        <label class="input w-full flex items-center gap-2">
          <LuSearch class="text-base-content/70" aria-hidden="true" />
          <input
            type="search"
            name="q"
            minLength={SEARCH_MIN_WORD_LENGTH}
            placeholder={
              total > 0
                ? `Search ${total.toLocaleString()} apps and games…`
                : "Search for an app or game…"
            }
            aria-label="Search apps and games"
            class="grow"
          />
        </label>
      </form>
    </div>
    <OsLine align="start" />
  </section>
));

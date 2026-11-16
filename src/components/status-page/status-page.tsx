import { component$, Slot } from "@qwik.dev/core";
import { LuSearch } from "@qwikest/icons/lucide";
import { SEARCH_MIN_WORD_LENGTH } from "~/search-fts";

/** The places a lost visitor most likely wanted: the same doors as the header. */
const WAYS_ON = [
  { href: "/", label: "Home" },
  { href: "/apps/", label: "Apps" },
  { href: "/games/", label: "Games" },
  { href: "/categories/", label: "Categories" },
  { href: "/docs/faq/", label: "Guides" },
];

/**
 * The body of a page that has nothing to show — not found (routes/404.tsx)
 * or an error (routes/error.tsx) — inside the site's usual header and
 * footer: the status code, a heading, what happened (the slot), a search
 * box and the main doors back into the site.
 */
export const StatusPage = component$<{ code: number; heading: string }>(({ code, heading }) => {
  return (
    <section class="flex flex-col items-center text-center gap-6 py-10 md:py-16">
      <p class="text-7xl md:text-8xl font-bold text-tuxery-gradient" aria-hidden="true">
        {code}
      </p>
      <h1 class="text-3xl font-bold">{heading}</h1>
      <div class="text-base-content/70 max-w-prose flex flex-col gap-2">
        <Slot />
      </div>
      <form action="/browse" method="get" class="w-full max-w-sm">
        <label class="input w-full flex items-center gap-2">
          <LuSearch class="text-base-content/70" />
          <input
            type="search"
            name="q"
            minLength={SEARCH_MIN_WORD_LENGTH}
            placeholder="Search for an app or a game…"
            aria-label="Search for an app or a game"
            class="grow"
          />
        </label>
      </form>
      <nav aria-label="Ways back into the site" class="flex flex-wrap justify-center gap-2">
        {WAYS_ON.map((link) => (
          <a key={link.href} href={link.href} class="btn btn-soft btn-sm">
            {link.label}
          </a>
        ))}
      </nav>
    </section>
  );
});

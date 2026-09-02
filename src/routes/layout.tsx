import { component$, Slot } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import { LuLayoutGrid, LuMenu, LuSearch, LuSettings, LuUser } from "@qwikest/icons/lucide";
import { Footer } from "~/components/footer/footer";
import { TuxeryLogo } from "~/components/tuxery-logo/tuxery-logo";
import { findOsEntry } from "~/os-catalog";
import { resolveServerEnv } from "~/server-env";
import { useProvideSettings } from "~/settings";
import { getHeroBackgroundPhoto } from "~/unsplash";

// Defined at the layout level (not routes/index.tsx) so every page gets the
// background, not just the homepage — a route can still reuse this exact
// loader (see routes/index.tsx's own, taller hero treatment) without a
// second fetch, since Qwik City resolves one loader instance per request
// regardless of how many components call it.
export const useHeroBackground = routeLoader$(async (requestEvent) => {
  return getHeroBackgroundPhoto(resolveServerEnv(requestEvent.platform));
});

const NAV_LINKS = [
  { href: "/apps/", label: "Apps" },
  { href: "/games/", label: "Games" },
  { href: "/categories/", label: "Categories" },
];

export default component$(() => {
  const settings = useProvideSettings();
  const bg = useHeroBackground().value;
  const location = useLocation();
  const isHome = location.url.pathname === "/";
  const osEntry = findOsEntry(settings.osId.value);

  return (
    <>
      <header class="navbar glass-card rounded-none! h-16 px-4 md:px-6 sticky! top-0 z-40">
        <div class="navbar-start gap-1">
          <div class="dropdown lg:hidden">
            <button type="button" class="btn btn-ghost btn-square" aria-label="Menu">
              <LuMenu class="text-lg" />
            </button>
            <ul
              tabIndex={0}
              role="menu"
              class="menu dropdown-content bg-base-100 rounded-box z-50 mt-3 w-48 p-2 shadow-lg border border-base-300"
            >
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <a href="/" class="btn btn-ghost text-xl px-2">
            <span class="flex items-center gap-2">
              <TuxeryLogo size={24} cutoutColor="var(--color-base-100)" />
              Tux<span class="text-tuxery-gradient">ery</span>
            </span>
          </a>

          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} class="btn btn-ghost hidden lg:inline-flex">
              {link.label === "Categories" && <LuLayoutGrid class="text-base" />}
              {link.label}
            </a>
          ))}
        </div>

        <div class="navbar-center hidden sm:flex">
          <form action="/browse" method="get" class="w-full max-w-xs">
            <label class="input input-sm flex items-center gap-2">
              <LuSearch class="text-base-content/50" />
              <input
                type="search"
                name="q"
                placeholder="Search…"
                aria-label="Search for an app"
                class="grow"
              />
            </label>
          </form>
        </div>

        <div class="navbar-end gap-1">
          {osEntry ? (
            <a href="/settings/?tab=os" class="btn btn-soft hidden sm:inline-flex">
              {osEntry.label}
            </a>
          ) : (
            <div class="aura aura-sm aura-rainbow hidden sm:inline-block">
              <a href="/settings/?tab=os" class="btn btn-soft btn-primary">
                Select your OS
              </a>
            </div>
          )}
          <a href="/about" class="btn btn-ghost hidden sm:inline-flex">
            About
          </a>
          <a href="/status" class="btn btn-ghost hidden sm:inline-flex">
            Status
          </a>
          <a href="/settings" class="btn btn-ghost btn-square" aria-label="Settings">
            <LuSettings class="text-lg" />
          </a>
          {/* No user space yet — inert placeholder for the future account entry point. */}
          <span
            class="btn btn-ghost btn-square btn-disabled"
            aria-disabled="true"
            aria-label="Account (coming soon)"
          >
            <LuUser class="text-lg" />
          </span>
        </div>
      </header>

      {bg && (
        // One element, rendered here (not inside <main>) so it's a sibling
        // of <main>, not a descendant — <main> has its own max-w-6xl
        // mx-auto, which would cap the background's width to the content
        // column instead of the real viewport if it were nested inside
        // (that was the actual bug: a homepage-only version nested in
        // routes/index.tsx negative-margined its way past <main>'s own
        // padding but was still bounded by <main>'s max-width, so it never
        // reached the true page edges). `position: fixed` covers the full
        // viewport width and stays pinned behind the sticky header on
        // every route. Taller and more dramatic on the homepage (its hero
        // is built for it — white text, centered) than the short band
        // every other route gets, fully resolved to base-100 well before
        // <main>'s own top padding ends either way, so it can never sit
        // behind a page's actual heading text.
        <div
          class="fixed inset-x-0 top-0 -z-10"
          style={{
            height: isHome ? "640px" : "168px",
            backgroundImage: `url(${bg.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div class="absolute inset-0 bg-gradient-to-b from-black/60 to-base-100" />
        </div>
      )}

      <main class="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14 min-h-[60vh]">
        <Slot />
      </main>

      <Footer />
    </>
  );
});

import { component$, Slot } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { LuLayoutGrid, LuMenu, LuSearch, LuSettings, LuUser } from "@qwikest/icons/lucide";
import { Footer } from "~/components/footer/footer";
import { useProvideSettings } from "~/settings";
import { getHeroBackgroundPhoto } from "~/unsplash";

// Defined at the layout level (not routes/index.tsx) so every page gets the
// background, not just the homepage — a route can still reuse this exact
// loader (see routes/index.tsx's own, taller hero treatment) without a
// second fetch, since Qwik City resolves one loader instance per request
// regardless of how many components call it.
export const useHeroBackground = routeLoader$(async () => {
  return getHeroBackgroundPhoto();
});

const NAV_LINKS = [
  { href: "/apps/", label: "Apps" },
  { href: "/games/", label: "Games" },
  { href: "/utils/", label: "Utils" },
  { href: "/categories/", label: "Categories" },
];

export default component$(() => {
  useProvideSettings();
  const bg = useHeroBackground().value;

  return (
    <>
      <header class="navbar bg-base-200 border-b border-base-300 px-4 md:px-6 sticky top-0 z-40">
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
            <span>
              🐧 Tux<span class="text-primary">ery</span>
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
        // Site-wide, every route — not just the homepage's own taller hero
        // treatment (routes/index.tsx). `position: fixed` so it stays
        // pinned behind the sticky header on every page rather than
        // needing a per-page height. Deliberately short and fully resolved
        // to base-100 by the time <main>'s own top padding ends (py-10
        // md:py-14 below the header), so it can never sit behind actual
        // heading text on any route — text contrast on non-homepage pages
        // was never designed around a photo background.
        <div
          class="fixed inset-x-0 top-0 h-[168px] -z-10"
          style={{
            backgroundImage: `url(${bg.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div class="absolute inset-0 bg-gradient-to-b from-black/50 to-base-100" />
        </div>
      )}

      <main class="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14 min-h-[60vh]">
        <Slot />
      </main>

      <Footer />
    </>
  );
});

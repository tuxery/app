import { component$, Slot } from "@qwik.dev/core";
import { routeLoader$, useLocation, type RequestHandler } from "@qwik.dev/router";
import {
  LuBookOpen,
  LuInfo,
  LuLayoutGrid,
  LuMenu,
  LuSearch,
  LuSettings,
  LuUser,
} from "@qwikest/icons/lucide";
import { Footer } from "~/components/footer/footer";
import { Logo } from "~/components/logo/logo";
import { OS_LOGOS } from "~/data/logos";
import { docsDoorOf, GUIDES_HREF } from "~/docs-nav";
import { TuxeryLogo } from "~/components/tuxery-logo/tuxery-logo";
import { findOsEntry } from "~/os-catalog";
import { resolveServerEnv } from "~/server-env";
import { useProvideSettings } from "~/settings";
import { getHeroBackgroundPhoto } from "~/unsplash";

// Every page is the same for every visitor (nothing reads cookies or
// per-user headers server-side; settings live client-side), so it can be
// shared from Cloudflare's edge. The cloudflare-pages adapter already
// `cache.put`s any OK GET response carrying a Cache-Control header into the
// datacenter's Cache API — this is what turns that on. Without it, the only
// cache in front of Turso was `~/catalog`'s per-isolate `cachedListing`,
// which a cold isolate (most requests in production) never hits. Same
// 10-minute horizon as that cache: data only changes when catalog
// republishes. Covers SSR HTML and the per-loader `q-loader-*.json`
// requests of client-side navigation (both GET — a Cache-Control set here
// takes precedence over Qwik Router v2's per-loader `private, no-cache`
// default); `server$` calls are POST and never cached.
export const onGet: RequestHandler = ({ cacheControl }) => {
  cacheControl({ public: true, maxAge: 60, sMaxAge: 600, staleWhileRevalidate: 3600 });
};

// Defined at the layout level (not routes/index.tsx) so every page gets the
// background, not just the homepage — a route can still reuse this exact
// loader (see routes/index.tsx's own, taller hero treatment) without a
// second fetch, since Qwik Router resolves one loader instance per request
// regardless of how many components call it.
export const useHeroBackground = routeLoader$(async (requestEvent) => {
  return getHeroBackgroundPhoto(resolveServerEnv(requestEvent.platform));
});

// Two doors into the same /docs/ section, by intent: help using Tuxery,
// or everything about the project (status, data, legal). "Docs" alone
// undersold the second. The footer still lists every page.
const DOCS_DOORS = [
  { id: "guides", href: GUIDES_HREF, label: "Guides", icon: LuBookOpen },
  { id: "about", href: "/docs/", label: "About", icon: LuInfo },
] as const;

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
  const docsDoor = docsDoorOf(location.url.pathname);
  const osEntry = findOsEntry(settings.osId.value);

  return (
    <>
      <header class="navbar glass-card rounded-none! overflow-visible! h-16 px-4 md:px-6 sticky! top-0 z-40">
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
              {/* The header's own Guides/About buttons are hidden below `sm`. */}
              {DOCS_DOORS.map((door) => (
                <li key={door.id} class="sm:hidden">
                  <a href={door.href}>{door.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <a href="/" class="btn btn-ghost text-xl px-2">
            <span class="flex items-center gap-2">
              <TuxeryLogo size={24} cutoutColor="var(--color-base-100)" />
              <span>
                Tux<span class="text-tuxery-gradient">ery</span>
              </span>
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
            <a href="/settings/?tab=os" class="btn btn-soft hidden sm:inline-flex gap-2">
              <Logo slug={OS_LOGOS[osEntry.id]} class="w-4 h-4" />
              {osEntry.label}
            </a>
          ) : (
            <div class="aura aura-sm aura-rainbow hidden sm:inline-block">
              <a href="/settings/?tab=os" class="btn btn-soft btn-primary">
                Select your OS
              </a>
            </div>
          )}
          {DOCS_DOORS.map((door) => (
            <a
              key={door.id}
              href={door.href}
              class={["btn btn-ghost hidden sm:inline-flex", docsDoor === door.id && "btn-active"]}
              aria-current={docsDoor === door.id ? "true" : undefined}
            >
              <door.icon class="text-base" />
              {door.label}
            </a>
          ))}
          <a href="/settings" class="btn btn-ghost btn-square" aria-label="Settings">
            <LuSettings class="text-lg" />
          </a>
          {/* No user space yet — inert placeholder for the future account entry point. */}
          <button
            type="button"
            class="btn btn-ghost btn-square"
            disabled
            aria-label="Account (coming soon)"
          >
            <LuUser class="text-lg" />
          </button>
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

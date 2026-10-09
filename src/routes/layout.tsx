import { component$, Slot } from "@qwik.dev/core";
import { routeLoader$, useLocation, type RequestHandler } from "@qwik.dev/router";
import { LuLayoutGrid, LuMenu, LuSearch, LuSettings, LuUser } from "@qwikest/icons/lucide";
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
// background, not just the homepage. The footer reuses it for the photo
// credit without a second fetch: Qwik Router resolves one loader instance
// per request however many components call it.
export const useHeroBackground = routeLoader$(async (requestEvent) => {
  return getHeroBackgroundPhoto(resolveServerEnv(requestEvent.platform));
});

// Two doors into the same /docs/ section, by intent: help using Tuxery,
// or everything about the project (status, data, legal). "Docs" alone
// undersold the second. The footer still lists every page.
const DOCS_DOORS = [
  { id: "guides", href: GUIDES_HREF, label: "Guides" },
  { id: "about", href: "/docs/", label: "About" },
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
              <LuSearch class="text-base-content/70" />
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
        // One element, rendered here as a sibling of <main> (not inside
        // it: <main>'s max-w-6xl would cap the photo to the content
        // column) and `position: fixed`, so it covers the whole viewport
        // behind every route and stays put while the page scrolls.
        // The photo itself, slightly blurred, as a texture behind the whole
        // page — no gradient, no overlay; opacity and blending per theme in
        // global.css (`.page-photo`). Pushed past the viewport edges
        // (-inset-8) so the blur doesn't fade them to a lighter rim.
        <div
          class="page-photo fixed -inset-8 -z-10"
          style={{
            backgroundImage: `url(${bg.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      <main class="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14 min-h-[60vh]">
        <Slot />
      </main>

      <Footer />
    </>
  );
});

import { component$, Slot } from "@builder.io/qwik";
import { LuLayoutGrid, LuSearch, LuSettings, LuUser } from "@qwikest/icons/lucide";
import { useProvideSettings } from "~/settings";

export default component$(() => {
  useProvideSettings();

  return (
    <>
      <header class="navbar bg-base-200 border-b border-base-300 px-4 md:px-6 sticky top-0 z-40">
        <div class="navbar-start gap-1">
          <a href="/" class="btn btn-ghost text-xl px-2">
            🐧 Tux<span class="text-primary">ery</span>
          </a>

          <a href="/apps" class="btn btn-ghost hidden md:inline-flex">
            Apps
          </a>
          <a href="/games" class="btn btn-ghost hidden md:inline-flex">
            Games
          </a>
          <a href="/utils" class="btn btn-ghost hidden md:inline-flex">
            Utils
          </a>
          <a href="/categories" class="btn btn-ghost hidden lg:inline-flex gap-1">
            <LuLayoutGrid class="text-base" />
            Categories
          </a>
        </div>

        <div class="navbar-center hidden sm:flex">
          <form action="/" method="get" class="w-full max-w-xs">
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
          <a href="/about" class="btn btn-ghost">
            About
          </a>
          <a href="/status" class="btn btn-ghost">
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

      <main class="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <Slot />
      </main>
    </>
  );
});

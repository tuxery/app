import { component$, Slot } from "@builder.io/qwik";
import { LuSettings, LuUser } from "@qwikest/icons/lucide";
import { useProvideSettings } from "~/settings";

export default component$(() => {
  useProvideSettings();

  return (
    <>
      <header class="navbar bg-base-200 border-b border-base-300 px-4 md:px-6">
        <div class="navbar-start">
          <a href="/" class="btn btn-ghost text-xl px-2">
            🐧 Tux<span class="text-primary">ery</span>
          </a>
        </div>

        <div class="navbar-end gap-1">
          <a href="/status" class="btn btn-ghost">
            Status
          </a>
          <a href="/about" class="btn btn-ghost">
            About
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

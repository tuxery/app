import { component$, Slot } from "@builder.io/qwik";

export default component$(() => {
  return (
    <>
      <header class="navbar bg-base-200 border-b border-base-300 px-4 md:px-6">
        <div class="navbar-start">
          <a href="/" class="btn btn-ghost text-xl px-2">
            🐧 Tux<span class="text-primary">ery</span>
          </a>
        </div>
      </header>

      <main class="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <Slot />
      </main>
    </>
  );
});

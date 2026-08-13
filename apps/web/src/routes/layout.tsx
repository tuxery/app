import { component$, Slot } from "@builder.io/qwik";

export default component$(() => {
  return (
    <>
      <header class="tuxery-header">
        <a href="/" class="tuxery-brand">
          🐧 Tux<span class="tuxery-brand-accent">ery</span>
        </a>
      </header>

      <main class="tuxery-main">
        <Slot />
      </main>
    </>
  );
});

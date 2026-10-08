import { component$, isDev } from "@qwik.dev/core";
import { RouterOutlet, useQwikRouter } from "@qwik.dev/router";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";

// Runs before paint, on every route — reads the persisted theme choice
// (same storage key as settings.ts) and sets data-theme immediately, so
// there's no flash of the wrong theme while Qwik resumes.
const ANTI_FOUC_SCRIPT = `(function(){
  try {
    var raw = localStorage.getItem('tuxery:settings');
    var theme = raw ? JSON.parse(raw).theme : null;
    var dark = theme === 'dark' || ((!theme || theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dim' : 'nord');
  } catch (e) {}
})();`;

export default component$(() => {
  // The root reads no signals, so the hook is enough — no need for the
  // reactive <QwikRouterProvider> wrapper. `viewTransition` (opt-in in Qwik
  // Router) animates SPA navigations with the View Transition API.
  useQwikRouter({ viewTransition: true });

  return (
    <>
      <head>
        <meta charset="utf-8" />
        <script dangerouslySetInnerHTML={ANTI_FOUC_SCRIPT} />
        {!isDev && <link rel="manifest" href={`${import.meta.env.BASE_URL}manifest.json`} />}
        <RouterHead />
      </head>
      <body lang="en">
        <RouterOutlet />
      </body>
    </>
  );
});

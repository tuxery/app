import { component$, isDev } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";

export default component$(() => {
  /**
   * The root of a QwikCity site always start with the <QwikCityProvider> component,
   * immediately followed by the document's <head> and <body>.
   *
   * Don't remove the `<head>` and `<body>` elements.
   */

  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        {/* Sets data-theme before first paint so light/dark/system never flashes the wrong theme. */}
        <script
          dangerouslySetInnerHTML={`(function(){try{var s=localStorage.getItem('tuxery:settings');var t=s?JSON.parse(s).theme:null;var dark=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',dark?'tuxerydark':'tuxerylight');}catch(e){}})();`}
        />
        {!isDev && <link rel="manifest" href={`${import.meta.env.BASE_URL}manifest.json`} />}
        <RouterHead />
      </head>
      <body lang="en" class="tuxery-theme">
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  );
});

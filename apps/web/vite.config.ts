/**
 * This is the base config for vite.
 * When building, the adapter config is used which loads this file and extends it.
 */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Pinned so the qwikCity plugin's default `routesDir` (resolved from Vite's
// `root`) always points at apps/web/src/routes, even when this config is
// loaded standalone via `adapters/cloudflare-pages/vite.config.ts` (e.g. by
// the Vitest VS Code extension) — Vite otherwise defaults `root` to the
// directory of whichever config file was actually loaded.
const ROOT = fileURLToPath(new URL(".", import.meta.url));

/**
 * Note that Vite normally starts from `index.html` but the qwikCity plugin makes start at `src/entry.ssr.tsx` instead.
 */
export default defineConfig(() => {
  return {
    root: ROOT,
    plugins: [qwikCity(), qwikVite(), tsconfigPaths({ root: "." })],
    // This tells Vite which dependencies to pre-build in dev mode.
    optimizeDeps: {
      // Put problematic deps that break bundling here, mostly those with binaries.
      exclude: [],
    },
    server: {
      host: "0.0.0.0",
      headers: {
        // Don't cache the server response in dev mode
        "Cache-Control": "public, max-age=0",
      },
    },
    preview: {
      headers: {
        // Do cache the server response in preview (non-adapter production build)
        "Cache-Control": "public, max-age=600",
      },
    },
    test: {
      environment: "node",
      include: ["src/**/*.spec.ts", "src/**/*.spec.tsx"],
      // No unit tests yet — apps/web is UI-only for now (see AGENTS.md:
      // logic lives in packages/matcher and packages/sources instead).
      passWithNoTests: true,
    },
  };
});

/**
 * This is the base config for vite.
 * When building, the adapter config is used which loads this file and extends it.
 */
/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type UserConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// Shared credentials live in tuxery/.dev, one file for both this repo and
// catalog (see catalog/scripts/seed.ts's matching --remote mode) rather
// than duplicated .env copies that can drift. `envDir` is Vite's own
// mechanism for pointing .env loading somewhere other than the project
// root — no custom sync script needed.
const SHARED_ENV_DIR = "../.dev";

/**
 * Note that Vite normally starts from `index.html` but the qwikCity plugin makes start at `src/entry.ssr.tsx` instead.
 */
export default defineConfig(({ mode }): UserConfig => {
  // Third argument "" (no VITE_ prefix filter) loads every var, including
  // ones never meant to reach the client bundle. Assigning to process.env
  // is what makes them readable as plain env vars in server-only code
  // (routeLoader$, etc.) — loadEnv() alone only returns them.
  const sharedEnv = loadEnv(mode, SHARED_ENV_DIR, "");
  process.env.TURSO_DB_URL ??= sharedEnv.TURSO_DB_URL;
  process.env.TURSO_DB_AUTH_TOKEN ??= sharedEnv.TURSO_DB_AUTH_TOKEN;

  return {
    envDir: SHARED_ENV_DIR,
    plugins: [qwikCity(), qwikVite(), tsconfigPaths({ root: "." }), tailwindcss()],
    // This tells Vite which dependencies to pre-build in dev mode.
    optimizeDeps: {
      // Put problematic deps that break bundling here, mostly those with binaries.
      exclude: [],
    },
    server: {
      host: true,
      port: 5173,
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
    // No test files exist yet (the monorepo's unit-tested `matcher` package
    // moved to `catalog`) — vitest exits 1 on an empty suite by default,
    // which would otherwise fail CI for no real reason.
    test: {
      passWithNoTests: true,
    },
  };
});

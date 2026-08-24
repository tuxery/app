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

// catalog's `pnpm serve` (a local `turso dev` server) is the default target
// for local dev — must match its LOCAL_DB_PORT in catalog/scripts/serve.ts.
const LOCAL_TURSO_URL = "http://localhost:8080";

/**
 * Note that Vite normally starts from `index.html` but the qwikCity plugin makes start at `src/entry.ssr.tsx` instead.
 */
export default defineConfig(({ mode }): UserConfig => {
  // Third argument "" (no VITE_ prefix filter) loads every var, including
  // ones never meant to reach the client bundle. Assigning to process.env
  // is what makes them readable as plain env vars in server-only code
  // (routeLoader$, etc.) — loadEnv() alone only returns them.
  //
  // `dev`/`start` scripts are locked to exactly "vite --mode ssr" (see
  // package.json), and Vite's own CLI rejects any unrecognized flag, so a
  // `--remote` CLI flag (as catalog's plain Node scripts use) can't work
  // here — TUXERY_REMOTE is an env var instead: `TUXERY_REMOTE=1 pnpm dev`.
  // Without it, TURSO_DB_URL defaults to the local turso dev server rather
  // than the shared .dev/.env's real hosted DB, which was always winning
  // before (nothing ever set TURSO_DB_URL locally) — every query paying a
  // real network round-trip to aws-eu-west-1 on every request, the actual
  // cause of "pnpm dev is extremely slow".
  if (process.env.TUXERY_REMOTE) {
    const sharedEnv = loadEnv(mode, SHARED_ENV_DIR, "");
    process.env.TURSO_DB_URL ??= sharedEnv.TURSO_DB_URL;
    process.env.TURSO_DB_AUTH_TOKEN ??= sharedEnv.TURSO_DB_AUTH_TOKEN;
  } else {
    process.env.TURSO_DB_URL ??= LOCAL_TURSO_URL;
  }

  // Unrelated to the local/remote DB toggle above — always loaded, same
  // shared .dev/.env, server-only (never a VITE_-prefixed var, so it never
  // reaches the client bundle).
  const sharedEnv = loadEnv(mode, SHARED_ENV_DIR, "");
  process.env.UNSPLASH_ACCESS_KEY ??= sharedEnv.UNSPLASH_ACCESS_KEY;

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
    // No unit test files exist yet (the monorepo's unit-tested `matcher`
    // package moved to `catalog`) — vitest exits 1 on an empty suite by
    // default, which would otherwise fail CI for no real reason. e2e/ and
    // e2e-degraded/ are excluded since those are Playwright specs, run via
    // `pnpm test.e2e` instead — vitest's own default include glob would
    // otherwise try (and fail) to run them as unit tests too.
    test: {
      passWithNoTests: true,
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/.{idea,git,cache,output,temp}/**",
        "**/e2e/**",
        "**/e2e-degraded/**",
      ],
    },
  };
});

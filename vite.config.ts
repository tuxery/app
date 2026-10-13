/**
 * This is the base config for vite.
 * When building, the adapter config is used which loads this file and extends it.
 */
/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type UserConfig } from "vite";
import { qwikVite } from "@qwik.dev/core/optimizer";
import { qwikRouter } from "@qwik.dev/router/vite";
import tailwindcss from "@tailwindcss/vite";
import { execFileSync } from "node:child_process";

// Tuxery has three environments, each reading its own Turso credentials
// (or none) from `tuxery/.dev`'s shared `.env*` files:
//   - **dev**     — local only, this file, always the local `turso dev`
//                   server below. Never a hosted DB — removed 2026-09-03,
//                   see LOCAL_TURSO_URL's own comment for why.
//   - **preview** — the Cloudflare preview Worker, one deploy per PR/
//                   branch (`.dev/.env.preview`; wrangler.jsonc's
//                   `env.preview`, deploy.yml).
//   - **prod**    — the live site (`.dev/.env.prod`; wrangler.jsonc's
//                   `env.production`).
// This file only ever configures dev. preview/prod get their credentials
// from real Cloudflare Worker secrets instead (pushed by
// scripts/push-cloudflare-secrets.sh) — `~/server-env`'s
// resolveServerEnv() is what actually reads them at runtime, via
// Cloudflare's `platform.env`; see that file's own header comment for
// why `process.env` alone can't do this. `envDir` below is Vite's own
// mechanism for pointing .env loading at that shared directory rather
// than duplicating credential copies here that could drift — no custom
// sync script needed for the one dev-relevant var this file still reads
// from it (Unsplash, further down).
const SHARED_ENV_DIR = "../.dev";

// catalog's `pnpm serve` (a local `turso dev` server, run from the
// catalog repo) is the only local dev target — must match its
// LOCAL_DB_PORT in catalog/scripts/serve.ts. Always used, unconditionally
// — there is no way to opt dev into a hosted DB anymore (baxyz retired
// that, 2026-09-03: a real network round trip to aws-eu-west-1 on every
// single request, which is what pointing dev at a hosted DB meant, was
// the actual cause of "pnpm dev is extremely slow" when it was ever the
// default, and there's no shared "dev" Turso account to opt into instead
// of that anyway — preview and prod both belong to their own Cloudflare
// Worker environment, not to a local dev server).
const LOCAL_TURSO_URL = "http://localhost:8080";

// The app has no version number to bump (private, deployed continuously):
// the footer shows the commit it was built from and that commit's date, not
// the build date, so two builds of one commit are one version. "dev" and an
// empty date outside a git checkout (a source tarball).
function appCommit(): { commit: string; date: string } {
  try {
    const [commit, date] = execFileSync("git", ["log", "-1", "--format=%h%n%cI"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .split("\n");
    if (commit && date) return { commit, date: new Date(date).toISOString() };
  } catch {
    // keep the fallback
  }
  return { commit: "dev", date: "" };
}

/**
 * Note that Vite normally starts from `index.html` but the qwikRouter plugin makes start at `src/entry.ssr.tsx` instead.
 */
export default defineConfig(({ mode }): UserConfig => {
  // dev only ever talks to the local turso dev server above — see
  // LOCAL_TURSO_URL's comment for why there is deliberately no way to
  // point it at a hosted DB instead. Assigning to process.env (not just
  // reading it) is what makes this readable as a plain env var in
  // server-only code (routeLoader$, etc.) via `~/server-env`'s
  // process.env fallback — loadEnv() alone only returns it.
  process.env.TURSO_DB_URL ??= LOCAL_TURSO_URL;

  // Unrelated to the DB line above — Unsplash has no local/hosted split,
  // it's the real API either way. Always loaded from the shared
  // .dev/.env, server-only (never a VITE_-prefixed var, so it never
  // reaches the client bundle).
  const sharedEnv = loadEnv(mode, SHARED_ENV_DIR, "");
  process.env.UNSPLASH_ACCESS_KEY ??= sharedEnv.UNSPLASH_ACCESS_KEY;

  const app = appCommit();

  return {
    envDir: SHARED_ENV_DIR,
    define: {
      APP_COMMIT: JSON.stringify(app.commit),
      APP_COMMIT_DATE: JSON.stringify(app.date),
    },
    plugins: [qwikRouter(), qwikVite(), tailwindcss()],
    // Resolves tsconfig.json's `~/*` alias (Vite's built-in support).
    resolve: { tsconfigPaths: true },
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
    // Vite's own `preview` command (`pnpm preview` — serves a plain built
    // `dist/` locally, no Cloudflare adapter) — unrelated to Tuxery's
    // Cloudflare "preview" environment described above, despite the name.
    preview: {
      headers: {
        // Do cache the server response here, unlike dev's header above.
        "Cache-Control": "public, max-age=600",
      },
    },
    // No unit test files exist yet (the monorepo's unit-tested `matcher`
    // package moved to `catalog`) — vitest exits 1 on an empty suite by
    // default, which would otherwise fail CI for no real reason. e2e/,
    // e2e-degraded/, and e2e-worker/ are excluded since those are
    // Playwright specs, run via `pnpm test.e2e`/`.degraded`/`.worker`
    // instead — vitest's own default include glob would otherwise try
    // (and fail) to run them as unit tests too.
    test: {
      passWithNoTests: true,
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/.{idea,git,cache,output,temp}/**",
        "**/e2e/**",
        "**/e2e-degraded/**",
        "**/e2e-worker/**",
      ],
    },
  };
});

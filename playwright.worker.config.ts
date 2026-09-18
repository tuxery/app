import { defineConfig } from "@playwright/test";

// Regression coverage for the class of bug fixed in
// server-env.ts/catalog.ts/unsplash.ts: reading `process.env` for Worker
// secrets instead of `requestEvent.platform.env`. `process.env` is real in
// `pnpm dev`'s plain Vite/Node server, so e2e/'s own suite (playwright.
// config.ts) cannot reproduce or catch this — it only breaks in the actual
// built Cloudflare Workers bundle, where Vite bakes `process.env` into a
// dead, empty object at build time (see README.md's Deployment section).
// This config runs against that real artifact instead: `wrangler dev`
// serving a fresh `pnpm run build`, reading `.dev.vars` (gitignored — see
// README.md) for real bindings via `platform.env`, the same channel the
// deployed Worker uses. Point it at catalog's own local `turso dev` server
// (`TURSO_DB_URL=http://localhost:8080`, same as CI's e2e-worker job, see
// ci.yml) rather than the hosted preview DB — that shared DB's publish
// pipeline is broken and its write quota is exhausted, and this test only
// cares about exercising `platform.env` wiring, not real preview data.
// `wrangler dev` is emulating the Cloudflare Worker runtime, so — unlike
// plain `pnpm dev`/`start` — it never runs through vite.config.ts's own
// `TURSO_DB_URL` default (see that file); `.dev.vars` has to spell it out
// explicitly instead.
export default defineConfig({
  testDir: "./e2e-worker",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:8789",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm run build && pnpm exec wrangler dev --port 8789",
    url: "http://localhost:8789",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

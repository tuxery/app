import { defineConfig } from "@playwright/test";

// Regression coverage for the class of bug fixed in
// server-env.ts/catalog.ts/unsplash.ts: reading `process.env` for Worker
// secrets instead of `requestEvent.platform.env`. `process.env` is real in
// `pnpm dev`'s plain Vite/Node server, so e2e/'s own suite (playwright.
// config.ts) cannot reproduce or catch this — it only breaks in the actual
// built Cloudflare Workers bundle, where Vite bakes `process.env` into a
// dead, empty object at build time (see README.md's Deployment section).
// This config runs against that real artifact instead: `wrangler dev`
// serving a fresh `pnpm run build`, reading `.dev.vars` (gitignored — copy
// the three keys from `../.dev/.env.preview`, see README.md) for real
// bindings via `platform.env`, the same channel the deployed Worker uses.
// `.env.preview`, not `.env` — `wrangler dev` is emulating the Cloudflare
// Worker runtime, so it gets the preview environment's own DB, same as
// CI's e2e-worker job (see ci.yml); plain local dev (`pnpm dev`/`start`,
// no Cloudflare emulation at all) is the only thing that uses the local
// sqlite server instead, see vite.config.ts.
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

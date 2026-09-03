import { defineConfig, devices } from "@playwright/test";

// These tests need real catalog data to test search/browse/detail flows
// against — that means tuxery/catalog's local server (`pnpm seed` once,
// then `pnpm serve`) must already be running before these tests start, on
// the same http://127.0.0.1:8080 default `pnpm dev`/`pnpm start` already
// use. The degraded-catalog case (no TURSO_DB_URL at all) is deliberately
// a separate config — see playwright.degraded.config.ts — since it needs
// its own dev server instance with that env var unset, not shared with
// this one.
const TURSO_DB_URL = process.env.TURSO_DB_URL ?? "http://127.0.0.1:8080";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // `mobile-*.spec.ts` files assume the sub-`lg` layout (hamburger menu
      // instead of the nav links, hero search bar full-width, ...) — a
      // desktop viewport never shows that layout at all, so they'd just
      // fail here rather than test anything meaningful.
      testIgnore: /mobile-.*\.spec\.ts/,
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], hasTouch: true, isMobile: true },
      // Every new mobile-specific spec should follow this `mobile-*` naming
      // convention rather than editing this regex per file.
      testMatch: /mobile-.*\.spec\.ts/,
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    env: { TURSO_DB_URL },
  },
});

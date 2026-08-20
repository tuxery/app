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
      // The mobile nav dropdown only exists below the `lg` breakpoint — a
      // desktop viewport never shows the trigger button at all.
      testIgnore: /mobile-nav\.spec\.ts/,
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
      testMatch: /mobile-nav\.spec\.ts/,
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    env: { TURSO_DB_URL },
  },
});

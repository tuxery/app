import { defineConfig, devices } from "@playwright/test";

// Deliberately separate from playwright.config.ts: this is the one place
// TURSO_DB_URL must be *unset*, so it needs its own dev server instance
// (a different port, so it can run alongside the main suite without
// clashing) rather than sharing that config's webServer.
export default defineConfig({
  testDir: "./e2e-degraded",
  reporter: "list",
  use: {
    baseURL: "http://localhost:5176",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm exec vite --mode ssr --port 5176",
    url: "http://localhost:5176",
    reuseExistingServer: false,
    env: { TURSO_DB_URL: "" },
  },
});

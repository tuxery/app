import { test, expect } from "@playwright/test";

// Doesn't pin a specific app id (unlike e2e/app-detail.spec.ts) —
// deliberately dataset-agnostic, since the point is proving the Worker
// bundle can reach the DB *at all* through `platform.env`, not exercising
// any particular app's page. See playwright.worker.config.ts's header for
// why this needs its own config/runner instead of living in e2e/.
test("the catalog loads through the real Worker bundle, not just Vite dev", async ({ page }) => {
  await page.goto("/status/");

  const total = await page.locator(".stat-value.text-primary").innerText();
  expect(Number(total.replace(/[^0-9]/g, ""))).toBeGreaterThan(0);

  const snapshot = await page.locator(".stat-value.text-lg").innerText();
  expect(snapshot.trim()).not.toBe("—");
});

import { test, expect } from "@playwright/test";

// Direct regression test for the real, live incident this whole class of
// fix (server-env.ts, platform.env vs process.env) grew out of: production
// silently showed "0 apps" / "—" with no error anywhere. This runs against
// `pnpm dev` (real Node process.env, not the Cloudflare Worker bundle
// process.env is dead in — see e2e-worker/'s own coverage for that half),
// so it can't catch the platform.env bug itself, but it does guard the
// catalog data actually reaching this specific page at all.
test("the status page shows a real catalog count and snapshot date, not the empty/degraded state", async ({
  page,
}) => {
  await page.goto("/status/");

  const total = await page.locator(".stat-value.text-primary").innerText();
  expect(Number(total.replace(/[^0-9]/g, ""))).toBeGreaterThan(0);

  const snapshot = await page.locator(".stat-value.text-lg").innerText();
  expect(snapshot.trim()).not.toBe("—");
});

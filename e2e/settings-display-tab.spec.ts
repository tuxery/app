import { test, expect } from "@playwright/test";

// The Display tab (theme switcher) had zero coverage — every other
// settings.spec.ts/os-selector.spec.ts test only ever visits ?tab=os or
// ?tab=sources.
test("picking a theme sets data-theme, persists, and survives a reload", async ({ page }) => {
  await page.goto("/settings/?tab=display");

  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dim", { timeout: 15_000 });
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("tuxery:settings")), { timeout: 15_000 })
    .toContain('"theme":"dark"');

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dim", { timeout: 15_000 });

  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "nord", { timeout: 15_000 });
});

test("a choice made before the page finishes loading is kept and saved", async ({
  page,
  context,
}) => {
  // Regression test for a real race: on a slow first load the click can
  // come before the settings' first persistence run, which used to load
  // the stored settings over it and return without saving — it lost the
  // choice 5 times in 6 with this throttling, and made the settings specs
  // fail on CI's cold first attempt. A stored OS must survive it too.
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return;
    localStorage.setItem("tuxery:settings", JSON.stringify({ theme: "dark", osId: "fedora" }));
    sessionStorage.setItem("seeded", "1");
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 12 });

  await page.goto("/settings/?tab=display", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Light", exact: true }).click();

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("tuxery:settings")), { timeout: 20_000 })
    .toContain('"theme":"light"');
  expect(await page.evaluate(() => localStorage.getItem("tuxery:settings"))).toContain(
    '"osId":"fedora"',
  );
});

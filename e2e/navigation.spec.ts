import { test, expect, type Page } from "@playwright/test";

// The glitches on navigation (2026-10-16): every internal link reloaded the
// whole page, and on each load the header showed defaults before the
// visitor's own settings — "Select your OS" before their OS, the light
// theme before the dark one they chose. See the click handlers in
// src/routes/layout.tsx and `hydrated` in src/settings.ts.

/** A visitor who chose the dark theme and Fedora, on a light-scheme system; records every theme and OS button state the page goes through. */
async function returningVisitor(page: Page) {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    if (!localStorage.getItem("tuxery:settings")) {
      localStorage.setItem(
        "tuxery:settings",
        JSON.stringify({ theme: "dark", osId: "fedora", installGroups: [] }),
      );
    }
    const seen = ((window as unknown as { __seen: string[] }).__seen = []);
    const record = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      if (theme) seen.push(`theme:${theme}`);
      for (const link of document.querySelectorAll("header a[href^='/settings/?tab=os']")) {
        seen.push(`os:${link.textContent?.trim()}`);
      }
    };
    new MutationObserver(record).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  });
}

const seen = (page: Page) =>
  page.evaluate(() => (window as unknown as { __seen: string[] }).__seen);

test("an internal link navigates client-side: same document, new page", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(
    () => ((window as unknown as { __sameDocument: boolean }).__sameDocument = true),
  );

  await page.locator("header").getByRole("link", { name: "Games" }).click();
  await expect(page).toHaveURL(/\/games\/$/);
  await expect(page.locator("main h1").first()).toHaveText("Games");
  expect(
    await page.evaluate(() => (window as unknown as { __sameDocument?: boolean }).__sameDocument),
  ).toBe(true);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test("a link opened in a new tab or with a modifier is left to the browser", async ({
  page,
  context,
}) => {
  await page.goto("/");
  // Ctrl/Cmd+click opens a background tab: a new page in the context, not a popup.
  const [tab] = await Promise.all([
    context.waitForEvent("page"),
    page
      .locator("header")
      .getByRole("link", { name: "Games" })
      .click({ modifiers: ["ControlOrMeta"] }),
  ]);
  await expect(tab).toHaveURL(/\/games\/$/);
  await expect(page).toHaveURL(/\/$/);
});

test("a returning visitor never sees the default theme or 'Select your OS' first", async ({
  page,
}) => {
  await returningVisitor(page);
  await page.goto("/");
  await expect(page.locator("header").getByRole("link", { name: "Fedora" })).toBeVisible();
  await page.locator("header").getByRole("link", { name: "Games" }).click();
  await expect(page.locator("main h1").first()).toHaveText("Games");

  const states = await seen(page);
  expect(states).not.toContain("theme:nord");
  expect(states).not.toContain("os:Select your OS");
  expect(states).toContain("os:Fedora");
});

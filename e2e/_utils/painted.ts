import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * `toBeVisible()` checks the element's own `display`/`visibility`/
 * `opacity` and that it has a non-zero box — none of which catch an
 * ancestor clipping it via `overflow: hidden`/`clip`. Real bug, found
 * live: the mobile nav dropdown was clipped by the header's
 * `overflow: hidden` (inherited from `.glass-card`), yet
 * `e2e/mobile-nav.spec.ts`'s `toBeVisible()` + `.click()` passed
 * unchanged on the broken build — Playwright's actionability checks
 * don't check paint-level clipping either.
 *
 * This checks what a real user's eye (and finger) would: whether the
 * browser actually painted this element (or one of its descendants) at
 * its own center point, via `elementFromPoint` — which returns the
 * topmost thing genuinely rendered there, ancestor clipping included.
 */
export async function expectPainted(locator: Locator): Promise<void> {
  const isPainted = await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const painted = document.elementFromPoint(x, y);
    return painted !== null && (painted === el || el.contains(painted));
  });
  expect(
    isPainted,
    "expected element to be genuinely painted on screen, not clipped by an ancestor",
  ).toBe(true);
}

import { test, expect } from "@playwright/test";

// /sources/[id]/ (a dedicated per-store page, e.g. Flathub/Snap Store/GOG/
// Lutris) is a real route but currently isn't linked from anywhere in the
// UI — /sources/ and /distros/ both link straight to /browse/?source=...
// instead — so it had no coverage at all. Testing it directly by URL,
// since that's the only way anyone (a shared link, a bookmark) reaches it
// today.
test("a per-source store page shows real trending apps from that source", async ({ page }) => {
  await page.goto("/sources/flatpak-flathub/");
  await expect(page.getByRole("heading", { name: "Flathub", level: 1 })).toBeVisible();
  await expect(page.locator("a[href^='/app/']").first()).toBeVisible();

  await expect(page.getByRole("link", { name: "Visit Flathub" })).toHaveAttribute(
    "href",
    "https://flathub.org",
  );
});

test("an unknown source id 404s cleanly", async ({ page }) => {
  const response = await page.goto("/sources/not-a-real-source/");
  expect(response?.status()).toBe(404);
});

import { test, expect } from "@playwright/test";

test("header shows a rainbow-aura 'Select your OS' with none picked, and the plain OS label once one is", async ({
  page,
}) => {
  await page.goto("/");
  const selectButton = page.getByRole("link", { name: "Select your OS" });
  await expect(selectButton).toBeVisible();
  await expect(selectButton).toHaveClass(/btn-primary/);

  await selectButton.click();
  await expect(page).toHaveURL(/\/settings\/\?tab=os/);
  await page.getByRole("button", { name: "Ubuntu", exact: true }).click();
  // The pick persists from a client-side effect, not synchronously with
  // the click — poll rather than navigate away immediately, same flake
  // pattern as the other settings-write assertions in this repo.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("tuxery:settings")), { timeout: 15_000 })
    .toContain('"osId":"ubuntu"');

  await page.goto("/");
  const osButton = page.getByRole("link", { name: "Ubuntu", exact: true });
  await expect(osButton).toBeVisible();
  await expect(osButton).not.toHaveClass(/btn-primary/);
  await expect(page.getByRole("link", { name: "Select your OS" })).toHaveCount(0);
});

test("picking an OS on the tile grid switches to the jumbo, and Change goes back", async ({
  page,
}) => {
  await page.goto("/settings/?tab=os");
  await expect(page.getByRole("button", { name: "Ubuntu", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Ubuntu", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ubuntu", exact: true })).toBeVisible();
  await expect(page.getByText("Recommended sources")).toBeVisible();
  // Ubuntu's own recommended list — its native group plus the six
  // cross-distro ones — not, say, Fedora's.
  await expect(page.getByText("Ubuntu", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Flatpak", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Change" }).click();
  await expect(page.getByRole("button", { name: "Fedora", exact: true })).toBeVisible();
});

test("selecting an OS pre-fills Auto sources on the Sources tab without overriding an explicit choice", async ({
  page,
}) => {
  await page.goto("/settings/?tab=sources");

  // Explicitly turn Fedora Off before ever touching the OS Selector.
  const fedoraRow = page.locator('[aria-label="Show Fedora"]');
  await fedoraRow.getByRole("button", { name: "Off" }).click();
  await expect(fedoraRow.getByRole("button", { name: "Off" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Now select an OS that isn't Fedora.
  await page.goto("/settings/?tab=os");
  await page.getByRole("button", { name: "Ubuntu", exact: true }).click();
  // The pick persists from a client-side effect, not synchronously with
  // the click — poll rather than navigate away immediately, same flake
  // pattern as the other settings-write assertions in this repo.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("tuxery:settings")), { timeout: 15_000 })
    .toContain('"osId":"ubuntu"');

  // Back on Sources: Ubuntu's own Auto row now resolves to Snap Store
  // being pre-activated (Ubuntu ships snapd), but Fedora's explicit Off
  // survived the OS pick untouched.
  await page.goto("/settings/?tab=sources");
  await expect(
    page.locator('[aria-label="Show Fedora"]').getByRole("button", { name: "Off" }),
  ).toHaveAttribute("aria-pressed", "true");
  const snapStoreRow = page.locator('[aria-label="Snap Store activated"]');
  await expect(snapStoreRow.getByRole("button", { name: "Auto" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // Auto + Ubuntu selected -> effectively activated, so the setup note
  // (only shown when NOT effectively activated) is gone for Snap Store.
  await expect(page.getByText("installs snapd if it isn't already")).toHaveCount(0);
});

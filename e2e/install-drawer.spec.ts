import { test, expect } from "@playwright/test";

test("groups packages by platform, one collapsible per group (closed by default), native package managers show a copy-paste command", async ({
  page,
}) => {
  await page.goto("/app/pacman-aur%3A0ad-data-git/");
  await page.getByRole("button", { name: /Install options/ }).click();

  // Debian and Ubuntu are two different packaging groups, each its own
  // collapsible — not flattened into one raw source-per-row list. Closed
  // by default, so the command text isn't visible until expanded.
  const debianSummary = page.locator("summary", { hasText: "Debian" });
  const ubuntuSummary = page.locator("summary", { hasText: "Ubuntu" });
  const fedoraSummary = page.locator("summary", { hasText: "Fedora" });
  await expect(debianSummary).toBeVisible();
  await expect(page.getByText("sudo apt install 0ad-data").first()).not.toBeVisible();

  await debianSummary.click();
  await ubuntuSummary.click();
  await fedoraSummary.click();
  await expect(page.getByText("sudo apt install 0ad-data").first()).toBeVisible();
  await expect(page.getByText("sudo dnf install 0ad-data")).toBeVisible();
});

test("Flatpak's install button is the appstream:// deep link, with a terminal command and website fallback alongside it", async ({
  page,
}) => {
  await page.goto("/app/flatpak-flathub%3Aorg.mozilla.firefox/");
  await page.getByRole("button", { name: /Install options/ }).click();
  await page.locator("summary", { hasText: "Flatpak" }).click();

  await expect(page.getByText("Flathub", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Click to install" })).toHaveAttribute(
    "href",
    "appstream://org.mozilla.firefox",
  );
  await expect(page.getByText("flatpak install flathub org.mozilla.firefox")).toBeVisible();
  // The Flathub store page, not the developer's own homepage — real bug,
  // found live: this used to fall back to `pkg.homepage` (mozilla.org),
  // not the app's actual store listing.
  await expect(page.getByRole("link", { name: "Website" })).toHaveAttribute(
    "href",
    "https://flathub.org/apps/org.mozilla.firefox",
  );
});

test("a native distro package with a real apt: handler (Debian) shows it as the install button", async ({
  page,
}) => {
  await page.goto("/app/flatpak-flathub%3Aorg.mozilla.firefox/");
  await page.getByRole("button", { name: /Install options/ }).click();
  await page.locator("summary", { hasText: "Debian" }).click();

  await expect(page.getByRole("link", { name: "Click to install" })).toHaveAttribute(
    "href",
    /^apt:/,
  );
});

test("AppImage shows a desktop-integration setup step and a Download button, not Click to install", async ({
  page,
}) => {
  await page.goto("/app/flatpak-flathub%3Acom.discordapp.Discord/");
  await page.getByRole("button", { name: /Install options/ }).click();
  await page.locator("summary", { hasText: "AppImage" }).click();

  await expect(page.getByText("Gear Lever", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Download" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Click to install" })).toHaveCount(0);
});

test("a native-package-only app shows a copy-paste command, even when it has an informational homepage", async ({
  page,
}) => {
  // 0cc-famitracker is AUR-only and has a real project homepage (not an
  // install link) — real bug, found live: an earlier "automatic mode"
  // used to treat any homepage as a clickable install action.
  await page.goto("/app/pacman-aur%3A0cc-famitracker/");
  await page.getByRole("button", { name: /Install options/ }).click();
  await page.locator("summary", { hasText: "Arch Linux" }).click();
  await expect(page.getByText("yay -S 0cc-famitracker")).toBeVisible();
});

test("a source with more than one channel (AUR's official/-bin/-git builds) shows a channel tab group, not stacked rows", async ({
  page,
}) => {
  await page.goto("/app/flatpak-flathub%3Aai.jan.Jan/");
  await page.getByRole("button", { name: /Install options/ }).click();
  await page.locator("summary", { hasText: "Arch Linux" }).click();

  // One tab group, not three separate rows — AUR is the Arch Linux group's
  // only source here, so its own label is omitted as redundant with the
  // "Arch Linux" heading right above (see SourceInstallUnit's showLabel).
  const stable = page.getByRole("tab", { name: "Stable" });
  const bin = page.getByRole("tab", { name: "Bin" });
  const git = page.getByRole("tab", { name: "Git" });
  await expect(stable).toBeVisible();
  await expect(bin).toBeVisible();
  await expect(git).toBeVisible();

  await expect(page.getByText("yay -S jan", { exact: true })).toBeVisible();
  await bin.click();
  await expect(page.getByText("yay -S jan-bin", { exact: true })).toBeVisible();
  await git.click();
  await expect(page.getByText("yay -S jan-git", { exact: true })).toBeVisible();
});

test("activating a source's setup persists and hides the setup step on future visits", async ({
  page,
}) => {
  await page.goto("/app/pacman-aur%3A0cc-famitracker/");
  await page.getByRole("button", { name: /Install options/ }).click();
  await page.locator("summary", { hasText: "Arch Linux" }).click();
  await expect(page.getByText("One-time — the AUR itself needs a helper")).toBeVisible();

  await page.getByRole("button", { name: "I've already done this" }).click();
  await expect(page.getByText("One-time — the AUR itself needs a helper")).toHaveCount(0);

  const stored = await page.evaluate(() => localStorage.getItem("tuxery:settings"));
  expect(stored).toContain('"id":"arch-aur","label":"AUR","activated":true');

  // Reload — the setup step should stay hidden (persisted, not just in-memory).
  await page.reload();
  await page.getByRole("button", { name: /Install options/ }).click();
  await page.locator("summary", { hasText: "Arch Linux" }).click();
  await expect(page.getByText("One-time — the AUR itself needs a helper")).toHaveCount(0);
  await expect(page.getByText("yay -S 0cc-famitracker")).toBeVisible();
});

test("Snap's setup step links to Snapcraft's own install guide instead of an apt-only command", async ({
  page,
}) => {
  // Discord Canary is merged into the main Discord app as a Snap channel
  // variant (see AUR_CHANNEL_WORD) — there's no standalone
  // snap-snapcraft:discord-canary app id to link to directly.
  await page.goto("/app/flatpak-flathub%3Acom.discordapp.Discord/");
  await page.getByRole("button", { name: /Install options/ }).click();
  await page.locator("summary", { hasText: "Snap" }).click();

  await expect(
    page.getByRole("link", { name: "https://snapcraft.io/docs/installing-snapd" }),
  ).toBeVisible();
});

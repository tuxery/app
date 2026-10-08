import { test, expect, type Page } from "@playwright/test";

/**
 * Discord's product page: every Discord build (stable, Canary, ...) is one
 * product. Catalog datasets published before product families named it
 * after the Canary snap (`discord-canary`); newer ones name it after its
 * default build (`discord`). Tries the new id first, so these tests pass
 * on either dataset while app and catalog land separately — drop the
 * fallback once catalog's product-families dataset is published.
 */
async function gotoDiscord(page: Page): Promise<void> {
  const response = await page.goto("/app/discord/");
  if (response?.status() === 404) await page.goto("/app/discord-canary/");
}

// Firefox/Discord/0ad below use their bare Snap name as the app id
// ("firefox", "discord", "0ad") — no "source:" prefix — since a
// Snap or Flatpak package's own name/appId is already globally unique on
// its own (Snap preferred when an app has both, see catalog's
// match/group.ts's buildAppId). 0cc-famitracker has neither, so it still
// uses "source:appId".

test("groups packages by platform, one collapsible per group (closed by default), native package managers show a copy-paste command", async ({
  page,
}) => {
  await page.goto("/app/0ad/");
  await page.getByRole("button", { name: "Install" }).click();

  // Debian and Ubuntu are two different packaging groups, each its own
  // collapsible — not flattened into one raw source-per-row list. Closed
  // by default, so the command text isn't visible until expanded.
  const debianSummary = page.locator("summary", { hasText: "Debian" });
  const ubuntuSummary = page.locator("summary", { hasText: "Ubuntu" });
  const fedoraSummary = page.locator("summary", { hasText: "Fedora" });
  await expect(debianSummary).toBeVisible();
  await expect(page.getByText("sudo apt install 0ad").first()).not.toBeVisible();

  await debianSummary.click();
  await ubuntuSummary.click();
  await fedoraSummary.click();
  await expect(page.getByText("sudo apt install 0ad").first()).toBeVisible();
  await expect(page.getByText("sudo dnf install 0ad")).toBeVisible();
});

test('the "Install options" label only shows when there\'s a prerequisite or more than one option', async ({
  page,
}) => {
  await gotoDiscord(page);
  await page.getByRole("button", { name: "Install" }).click();
  await page.locator("summary", { hasText: "Arch Linux" }).click();

  // openSUSE: no prerequisite, one option (command only) — label omitted.
  const opensuseSection = page.locator("details", {
    has: page.locator("summary", { hasText: "openSUSE" }),
  });
  await opensuseSection.locator("summary").click();
  await expect(opensuseSection.getByText("sudo zypper install discord")).toBeVisible();
  await expect(opensuseSection.getByText("Install options", { exact: true })).toHaveCount(0);

  // Arch's official repo: no prerequisite, but two options (command + View
  // on Arch Linux) — label shows to group them. AUR (the other source in
  // this group) also shows the label, for a different reason (its own
  // prerequisite) — so both together means exactly two, confirming
  // Official's own label is really there and not just AUR's.
  const archSection = page.locator("details", {
    has: page.locator("summary", { hasText: "Arch Linux" }),
  });
  await expect(archSection.getByText("sudo pacman -S discord")).toBeVisible();
  await expect(archSection.getByText("Install options", { exact: true })).toHaveCount(2);
});

test("Flatpak's install button is the appstream:// deep link, with a terminal command and website fallback alongside it", async ({
  page,
}) => {
  await page.goto("/app/firefox/");
  await page.getByRole("button", { name: "Install" }).click();
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
  await expect(page.getByRole("link", { name: "View on Flathub" })).toHaveAttribute(
    "href",
    "https://flathub.org/apps/org.mozilla.firefox",
  );
});

test("a native distro package with a real apt: handler (Debian) shows it as the install button", async ({
  page,
}) => {
  // Debian ships Firefox ESR only: its own page on a dataset with product
  // families, the plain product page on an older one (redirected there).
  await page.goto("/app/firefox/esr/");
  await page.getByRole("button", { name: "Install" }).click();
  await page.locator("summary", { hasText: "Debian" }).click();

  await expect(page.getByRole("link", { name: "Click to install" })).toHaveAttribute(
    "href",
    /^apt:/,
  );
});

test("AppImage shows a desktop-integration setup step and a Download button, not Click to install", async ({
  page,
}) => {
  await gotoDiscord(page);
  await page.getByRole("button", { name: "Install" }).click();
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
  await page.getByRole("button", { name: "Install" }).click();
  await page.locator("summary", { hasText: "Arch Linux" }).click();
  await expect(page.getByText("yay -S 0cc-famitracker")).toBeVisible();
});

test("a source with more than one build (AUR's official/-bin builds) shows a build tab group, and the git build is its own version", async ({
  page,
}) => {
  await page.goto("/app/jan-ai/");
  await page.getByRole("button", { name: "Install" }).first().click();
  await page.locator("summary", { hasText: "Arch Linux" }).click();

  // One tab group, not separate rows — AUR is the Arch Linux group's only
  // source here, so its own label is omitted as redundant with the "Arch
  // Linux" heading right above (see SourceInstallUnit's showLabel). A tab
  // shows its build ("Stable", "Bin"), but falls back to the package name
  // when two packages of the source share a build (Jan has both jan-bin
  // and jan-live-bin) — so the bin build is matched by either spelling.
  const stable = page.getByRole("tab", { name: "Stable" });
  const bin = page.getByRole("tab", { name: /^(Bin|jan-bin)$/ });
  await expect(stable).toBeVisible();
  await expect(bin).toBeVisible();
  await expect(page.getByText("yay -S jan", { exact: true })).toBeVisible();
  await bin.click();
  await expect(page.getByText("yay -S jan-bin", { exact: true })).toBeVisible();

  // The -git build is the Git version, at its own URL. A dataset published
  // before product families has no versions: that URL redirects back to
  // the product, where the git build is one more tab.
  await page.goto("/app/jan-ai/git/");
  await page.getByRole("button", { name: "Install" }).first().click();
  await page.locator("summary", { hasText: "Arch Linux" }).click();
  const git = page.getByRole("tab", { name: /^(Git|jan-git)$/ });
  if ((await git.count()) > 0) await git.click();
  await expect(page.getByText("yay -S jan-git", { exact: true })).toBeVisible();
});

test("activating a source's setup persists and hides the setup step on future visits", async ({
  page,
}) => {
  await page.goto("/app/pacman-aur%3A0cc-famitracker/");
  await page.getByRole("button", { name: "Install" }).click();
  await page.locator("summary", { hasText: "Arch Linux" }).click();
  await expect(page.getByText("One-time — the AUR itself needs a helper")).toBeVisible();

  await page.getByRole("button", { name: "I've already done this" }).click();
  await expect(page.getByText("One-time — the AUR itself needs a helper")).toHaveCount(0);

  const stored = await page.evaluate(() => localStorage.getItem("tuxery:settings"));
  expect(stored).toContain('"id":"arch-aur","label":"AUR","activated":"on"');

  // Reload — the setup step should stay hidden (persisted, not just in-memory).
  await page.reload();
  await page.getByRole("button", { name: "Install" }).click();
  await page.locator("summary", { hasText: "Arch Linux" }).click();
  await expect(page.getByText("One-time — the AUR itself needs a helper")).toHaveCount(0);
  await expect(page.getByText("yay -S 0cc-famitracker")).toBeVisible();
});

test("selecting an OS collapses its non-recommended platforms behind a 'Show N other platforms' toggle, expandable in place", async ({
  page,
}) => {
  await page.goto("/settings/?tab=os");
  await page.getByRole("button", { name: "Fedora", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("tuxery:settings")), { timeout: 15_000 })
    .toContain('"osId":"fedora"');

  await page.goto("/app/nicotine-plus/");
  await page.getByRole("button", { name: "Install" }).click();

  // Fedora and the always-recommended cross-distro formats show directly.
  await expect(page.locator("summary", { hasText: "Fedora" })).toBeVisible();
  await expect(page.locator("summary", { hasText: "Flatpak" })).toBeVisible();

  // Debian/Ubuntu (native packages Fedora doesn't recommend) start hidden
  // inside the collapsed toggle — present in the DOM (nested <details>
  // content isn't removed, just closed) but not visible until expanded.
  const debianSummary = page.locator("summary", { hasText: "Debian" });
  await expect(debianSummary).toBeHidden();

  const otherPlatforms = page.locator("summary", { hasText: /other platform/ });
  await expect(otherPlatforms).toBeVisible();

  await otherPlatforms.click();
  await expect(debianSummary).toBeVisible();
});

test("Snap's setup step links to Snapcraft's own install guide instead of an apt-only command", async ({
  page,
}) => {
  await gotoDiscord(page);
  await page.getByRole("button", { name: "Install" }).click();
  await page.locator("summary", { hasText: "Snap" }).click();

  await expect(
    page.getByRole("link", { name: "https://snapcraft.io/docs/installing-snapd" }),
  ).toBeVisible();
});

// Regression: the catalog's metadata-only `*-appstream` packages have no
// install method, and rendering one in the drawer threw — wedging the next
// re-render, so neither close control worked. 0ad carries several of them.
test("the drawer closes from both the ✕ button and the backdrop", async ({ page }) => {
  await page.goto("/app/0ad/");
  const heading = page.getByRole("heading", { name: "Install options" });
  const close = page.getByRole("button", { name: "Close install options" });

  await page.getByRole("button", { name: "Install" }).first().click();
  await expect(heading).toBeVisible();
  await close.last().click();
  await expect(heading).toBeHidden();

  await page.getByRole("button", { name: "Install" }).first().click();
  await expect(heading).toBeVisible();
  await close.first().click({ position: { x: 5, y: 5 } });
  await expect(heading).toBeHidden();
});

import { test, expect } from "@playwright/test";

// What search engines and link previews read: the sitemap (served here
// because the E2E server is local, see `servesSitemap`), the robots meta,
// the Open Graph tags, the app pages' JSON-LD, and the 404 page.
// Dataset-agnostic: the app it opens is the first one the sitemap lists.

/** Every `<loc>` of a sitemap or sitemap index. */
function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

/** A sitemap URL as a path on the server under test (they all name the canonical host). */
function localPath(url: string): string {
  return new URL(url).pathname;
}

test("the sitemap index lists the pages and every app, part by part", async ({ request }) => {
  const index = await request.get("/sitemap.xml");
  expect(index.status()).toBe(200);
  expect(index.headers()["content-type"]).toContain("application/xml");
  const sitemaps = locs(await index.text());
  expect(sitemaps[0]).toBe("https://tuxery.store/sitemaps/pages.xml");
  const appSitemaps = sitemaps.filter((url) => url.includes("/sitemaps/apps-"));
  expect(appSitemaps.length).toBeGreaterThan(0);

  const pages = locs(await (await request.get(localPath(sitemaps[0]))).text());
  expect(pages).toContain("https://tuxery.store/");
  expect(pages).toContain("https://tuxery.store/docs/faq/");

  const apps = locs(await (await request.get(localPath(appSitemaps[0]))).text());
  expect(apps.length).toBeGreaterThan(0);
  expect(apps.length).toBeLessThanOrEqual(10_000);
  for (const url of apps.slice(0, 20))
    expect(url).toMatch(/^https:\/\/tuxery\.store\/app\/[^/]+\/$/);

  expect((await request.get("/sitemaps/apps-no-such-category-1.xml")).status()).toBe(404);
});

test("an app page carries its link-preview tags and its JSON-LD", async ({ page, request }) => {
  const index = locs(await (await request.get("/sitemap.xml")).text());
  const firstPart = index.find((url) => url.includes("/sitemaps/apps-")) ?? "";
  const [appUrl] = locs(await (await request.get(localPath(firstPart))).text());
  const response = await page.goto(localPath(appUrl));
  expect(response?.status()).toBe(200);

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", appUrl);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", appUrl);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /^https?:\/\//,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);

  const jsonLd = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
  ) as Record<string, unknown>;
  expect(jsonLd["@type"]).toBe("SoftwareApplication");
  expect(jsonLd.url).toBe(appUrl);
  expect(jsonLd.operatingSystem).toBe("Linux");
  await expect(page).toHaveTitle(`${String(jsonLd.name)} — Tuxery`);
});

test("pages say noindex while the site is private, and describe themselves for link previews", async ({
  page,
}) => {
  const response = await page.goto("/apps/");
  expect(response?.headers()["x-robots-tag"]).toBe("noindex");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Apps");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://tuxery.store/og-image.jpg",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
});

test("a path no page answers gets the site's 404 page, with ways back in", async ({ page }) => {
  const response = await page.goto("/no-such-page/");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Page not found — Tuxery");
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();

  const waysBack = page.getByRole("navigation", { name: "Ways back into the site" });
  await waysBack.getByRole("link", { name: "Games" }).click();
  await expect(page).toHaveURL(/\/games\/$/);
  await expect(page.getByRole("heading", { level: 1 }).first()).not.toHaveText("Page not found");
});

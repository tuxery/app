import { describe, expect, it } from "vitest";
import {
  canonicalPath,
  canonicalUrl,
  DEFAULT_DESCRIPTION,
  isIndexableHost,
  isPreviewHost,
  pageImageMeta,
  robotsDirective,
  robotsHeader,
  robotsMeta,
  servesSitemap,
  SITE_IS_PUBLIC,
  socialImageFor,
  socialMeta,
  type HeadMeta,
} from "./seo";

describe("canonicalPath", () => {
  it("points a build-variant page at its app page", () => {
    expect(canonicalPath("/app/firefox/esr/")).toBe("/app/firefox/");
    expect(canonicalPath("/app/gnome-mines/candidate/")).toBe("/app/gnome-mines/");
    expect(canonicalPath("/app/jan-ai/git/")).toBe("/app/jan-ai/");
  });

  it("leaves every other path as it is", () => {
    expect(canonicalPath("/app/firefox/")).toBe("/app/firefox/");
    expect(canonicalPath("/")).toBe("/");
    expect(canonicalPath("/browse/")).toBe("/browse/");
    expect(canonicalPath("/docs/faq/")).toBe("/docs/faq/");
  });
});

describe("canonicalUrl", () => {
  it("uses the bare host, never www, and drops the query string", () => {
    expect(canonicalUrl("/app/firefox/esr/")).toBe("https://tuxery.store/app/firefox/");
    expect(canonicalUrl("/browse/")).toBe("https://tuxery.store/browse/");
  });
});

describe("robotsDirective", () => {
  it("keeps the claim form and the settings out of the index", () => {
    expect(robotsDirective("/claim/")).toBe("noindex, nofollow");
    expect(robotsDirective("/settings/")).toBe("noindex, nofollow");
    expect(robotsDirective("/app/firefox/")).toBeUndefined();
    expect(robotsDirective("/")).toBeUndefined();
  });
});

describe("isPreviewHost", () => {
  it("recognizes pull-request Previews, not the site itself", () => {
    expect(isPreviewHost("pr-104.preview.tuxery.store")).toBe(true);
    expect(isPreviewHost("pr-104-tuxery-web.baxyz.workers.dev")).toBe(true);
    expect(isPreviewHost("tuxery.store")).toBe(false);
    expect(isPreviewHost("www.tuxery.store")).toBe(false);
    expect(isPreviewHost("localhost")).toBe(false);
  });
});

describe("robotsHeader", () => {
  it("never lets a Preview be indexed", () => {
    expect(robotsHeader("pr-104.preview.tuxery.store")).toBe("noindex");
  });

  it("keeps the site itself out of the index until it is public", () => {
    expect(robotsHeader("tuxery.store")).toBe(SITE_IS_PUBLIC ? undefined : "noindex");
    expect(robotsHeader("tuxery.store", false)).toBe("noindex");
    expect(robotsHeader("tuxery.store", true)).toBeUndefined();
    expect(robotsHeader("pr-104.preview.tuxery.store", true)).toBe("noindex");
  });
});

describe("isIndexableHost", () => {
  it("is only ever the public site, never a Preview", () => {
    expect(isIndexableHost("tuxery.store", true)).toBe(true);
    expect(isIndexableHost("tuxery.store", false)).toBe(false);
    expect(isIndexableHost("pr-1.preview.tuxery.store", true)).toBe(false);
  });
});

describe("robotsMeta", () => {
  it("says what the header says, unless the page has a stricter directive of its own", () => {
    expect(robotsMeta("/app/firefox/", "tuxery.store", false)).toBe("noindex");
    expect(robotsMeta("/app/firefox/", "tuxery.store", true)).toBeUndefined();
    expect(robotsMeta("/settings/", "tuxery.store", true)).toBe("noindex, nofollow");
    expect(robotsMeta("/claim/", "tuxery.store", false)).toBe("noindex, nofollow");
    expect(robotsMeta("/", "pr-3.preview.tuxery.store", true)).toBe("noindex");
  });
});

describe("servesSitemap", () => {
  it("keeps production's sitemap for the launch, and shows it everywhere it can be checked", () => {
    expect(servesSitemap("tuxery.store", false)).toBe(false);
    expect(servesSitemap("tuxery.store", true)).toBe(true);
    expect(servesSitemap("pr-104.preview.tuxery.store", false)).toBe(true);
    expect(servesSitemap("localhost", false)).toBe(true);
    expect(servesSitemap("127.0.0.1", false)).toBe(true);
  });
});

describe("socialImageFor", () => {
  it("keeps a raster http(s) icon", () => {
    const icon = "https://dl.flathub.org/media/io/mpv/Mpv/x/icons/128x128/io.mpv.Mpv.png";
    expect(socialImageFor(icon)).toBe(icon);
    expect(socialImageFor("https://example.org/icon.JPG?v=2")).toBe(
      "https://example.org/icon.JPG?v=2",
    );
  });

  it("drops what link previews can't show", () => {
    expect(socialImageFor(undefined)).toBeUndefined();
    expect(socialImageFor("https://example.org/icon.svg")).toBeUndefined();
    expect(socialImageFor("https://example.org/icon")).toBeUndefined();
    expect(socialImageFor("ftp://example.org/icon.png")).toBeUndefined();
    expect(socialImageFor("not a url.png")).toBeUndefined();
  });
});

function content(tags: HeadMeta[], key: string): string | undefined {
  return tags.find((tag) => tag.property === key || tag.name === key)?.content;
}

describe("socialMeta", () => {
  it("describes a page with the site's image when it has none", () => {
    const tags = socialMeta({
      title: "Apps — Tuxery",
      url: "https://tuxery.store/apps/",
      metas: [{ name: "description", content: "Browse Linux apps." }],
    });
    expect(content(tags, "og:title")).toBe("Apps");
    expect(content(tags, "og:description")).toBe("Browse Linux apps.");
    expect(content(tags, "og:url")).toBe("https://tuxery.store/apps/");
    expect(content(tags, "og:site_name")).toBe("Tuxery");
    expect(content(tags, "og:image")).toBe("https://tuxery.store/og-image.jpg");
    expect(content(tags, "twitter:card")).toBe("summary_large_image");
  });

  it("falls back to the site's description, and keeps a title that doesn't end with the site's name", () => {
    const tags = socialMeta({
      title: "Tuxery — the unified Linux App Store",
      url: "https://tuxery.store/",
      metas: [],
    });
    expect(content(tags, "og:title")).toBe("Tuxery — the unified Linux App Store");
    expect(content(tags, "og:description")).toBe(DEFAULT_DESCRIPTION);
  });

  it("leaves the page's own image and card alone", () => {
    const icon = "https://example.org/icon.png";
    const metas = [{ name: "description", content: "An app." }, ...pageImageMeta(icon)];
    const tags = socialMeta({ title: "App — Tuxery", url: "https://tuxery.store/app/x/", metas });
    expect(content(tags, "og:image")).toBeUndefined();
    expect(content(tags, "og:image:width")).toBeUndefined();
    expect(content(tags, "twitter:card")).toBeUndefined();
    expect(content(metas, "og:image")).toBe(icon);
    expect(content(metas, "twitter:card")).toBe("summary");
  });
});

describe("pageImageMeta", () => {
  it("is nothing without an image", () => {
    expect(pageImageMeta(undefined)).toEqual([]);
  });
});

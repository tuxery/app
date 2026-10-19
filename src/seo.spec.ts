import { describe, expect, it } from "vitest";
import { canonicalPath, canonicalUrl, isPreviewHost, robotsDirective } from "./seo";

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

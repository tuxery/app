import { describe, expect, it } from "vitest";
import {
  featureView,
  HOME_FEATURES,
  liveFeatures,
  type HomeFeature,
  type ScheduledFeature,
} from "./home-features";
import { LOGO_PATHS } from "./logos";
import influencerPages from "./influencer-pages.json";

const guide = (title: string): HomeFeature => ({
  kind: "guide",
  title,
  teaser: "",
  href: "/docs/",
  logos: [],
});

describe("liveFeatures", () => {
  const entries: ScheduledFeature[] = [
    { feature: guide("always") },
    { feature: guide("from the 10th"), from: "2026-11-10" },
    { feature: guide("until the 10th"), until: "2026-11-10" },
    { feature: guide("the 10th only"), from: "2026-11-10", until: "2026-11-10" },
  ];
  const titles = (date: string) =>
    liveFeatures(entries, new Date(date)).map((f) => (f.kind === "guide" ? f.title : f.kind));

  it("keeps the entries live on the day, both bounds included, in order", () => {
    expect(titles("2026-11-09T12:00:00Z")).toEqual(["always", "until the 10th"]);
    expect(titles("2026-11-10T23:59:59Z")).toEqual([
      "always",
      "from the 10th",
      "until the 10th",
      "the 10th only",
    ]);
    expect(titles("2026-11-11T00:00:00Z")).toEqual(["always", "from the 10th"]);
  });
});

describe("HOME_FEATURES", () => {
  const features = HOME_FEATURES.map(({ feature }) => feature);

  it("names real creator pages and known logos", () => {
    const slugs = new Set(influencerPages.map((page) => page.slug));
    const creators = features.flatMap((f) => (f.kind === "creator" ? [f.slug] : []));
    const logos = features.flatMap((f) => (f.kind === "creator" ? [] : f.logos));
    expect(creators.filter((slug) => !slugs.has(slug))).toEqual([]);
    expect(logos.filter((logo) => !(logo in LOGO_PATHS))).toEqual([]);
  });

  it("links articles to http(s) pages and guides inside the site", () => {
    const articles = features.flatMap((f) => (f.kind === "article" ? [f.url] : []));
    const guides = features.flatMap((f) => (f.kind === "guide" ? [f.href] : []));
    expect(articles.filter((url) => !/^https?:\/\//.test(url))).toEqual([]);
    expect(guides.filter((href) => !/^\/[^/]/.test(href))).toEqual([]);
  });
});

describe("featureView", () => {
  const creator = {
    slug: "baxyz",
    name: "baxyz",
    tagline: "What I run.",
    count: 27,
    icons: [{ id: "firefox", name: "Firefox", iconUrl: "https://example.org/f.png" }],
  };

  it("asks what a creator installs, and links to their page", () => {
    const view = featureView({ kind: "creator", slug: "baxyz" }, creator);
    expect(view).toMatchObject({
      title: "What does baxyz really install?",
      href: "/creators/baxyz/",
      action: "See all 27 apps",
      external: false,
    });
    expect(view.icons).toHaveLength(1);
  });

  it("falls back to /creators/ when the page is gone", () => {
    expect(featureView({ kind: "creator", slug: "gone" })).toMatchObject({
      href: "/creators/",
      icons: [],
    });
  });

  it("opens an article on its own site, naming it", () => {
    const view = featureView({
      kind: "article",
      title: "T",
      teaser: "",
      url: "https://example.org/a",
      site: "example.org",
      logos: ["lutris"],
    });
    expect(view).toMatchObject({
      href: "https://example.org/a",
      external: true,
      action: "Read on example.org",
    });
  });
});

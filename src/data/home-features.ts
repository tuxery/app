/**
 * The homepage's featured entries: the big card at the top and the short
 * "Also featured" list beside it. Hand-edited like the creator pages: an
 * entry is a creator's page, one of our own guides, or an article on
 * another site. Each can be scheduled with `from`/`until` (inclusive UTC
 * dates); the first live entry gets the big card.
 *
 * An article on another site shows its title, the site's name and the
 * logos or icons of what it covers, never the site's own images.
 */

export type HomeFeature =
  | {
      kind: "creator";
      /** The creator page's slug (`influencer-pages.json`). */
      slug: string;
    }
  | {
      kind: "guide";
      title: string;
      teaser: string;
      href: string;
      /** `~/data/logos` slugs drawn beside the title. */
      logos: string[];
    }
  | {
      kind: "article";
      title: string;
      teaser: string;
      url: string;
      /** The site's name, as the link says it: "Read on <site>". */
      site: string;
      logos: string[];
    };

export interface ScheduledFeature {
  feature: HomeFeature;
  /** First day shown, `YYYY-MM-DD` (UTC); none for "already live". */
  from?: string;
  /** Last day shown, `YYYY-MM-DD` (UTC); none for "until removed". */
  until?: string;
}

export const HOME_FEATURES: readonly ScheduledFeature[] = [
  { feature: { kind: "creator", slug: "baxyz" } },
  {
    feature: {
      kind: "guide",
      title: "Flatpak, Snap or AppImage: which one should you pick?",
      teaser: "What each format does differently, and which one suits your system.",
      href: "/docs/formats/",
      logos: ["flathub", "snapcraft", "appimage"],
    },
  },
  {
    feature: {
      kind: "guide",
      title: "How Tuxery decides what's trending",
      teaser: "The popularity sources behind every Top 10, and how they're combined.",
      href: "/docs/rankings/",
      logos: ["debian", "archlinux", "homebrew"],
    },
  },
];

/** The entries live on `date`, in their listed order. */
export function liveFeatures(entries: readonly ScheduledFeature[], date: Date): HomeFeature[] {
  const day = date.toISOString().slice(0, 10);
  return entries
    .filter(({ from, until }) => (!from || from <= day) && (!until || day <= until))
    .map(({ feature }) => feature);
}

/** What a creator entry needs from its page, resolved by the homepage's loader. */
export interface CreatorPreview {
  slug: string;
  name: string;
  tagline: string;
  /** How many apps the page lists. */
  count: number;
  /** The first few of them with an icon. */
  icons: { id: string; name: string; iconUrl: string }[];
}

/** A featured entry as the homepage draws it, whatever its kind. */
export interface FeatureView {
  kind: HomeFeature["kind"];
  title: string;
  teaser: string;
  href: string;
  /** On another site: opens in a new tab, says so. */
  external: boolean;
  /** The big card's button. */
  action: string;
  logos: string[];
  icons: CreatorPreview["icons"];
}

/**
 * An entry ready to draw. A creator entry whose page is gone (`creator`
 * undefined) still links to /creators/, under a generic question.
 */
export function featureView(feature: HomeFeature, creator?: CreatorPreview): FeatureView {
  switch (feature.kind) {
    case "creator":
      return {
        kind: "creator",
        title: `What does ${creator?.name ?? "a Linux creator"} really install?`,
        teaser: creator?.tagline ?? "The apps Linux creators actually use, by category.",
        href: creator ? `/creators/${creator.slug}/` : "/creators/",
        external: false,
        action: creator ? `See all ${creator.count} apps` : "See their picks",
        logos: [],
        icons: creator?.icons ?? [],
      };
    case "guide":
      return { ...feature, external: false, action: "Read the guide", icons: [] };
    case "article":
      return {
        kind: "article",
        title: feature.title,
        teaser: feature.teaser,
        href: feature.url,
        external: true,
        action: `Read on ${feature.site}`,
        logos: feature.logos,
        icons: [],
      };
  }
}

/**
 * Static, free-form influencer pages — a block schema referencing apps by
 * id rather than duplicating their info, per the "Influencer page" card.
 * No authoring UI exists yet (needs an admin/auth system that doesn't
 * exist either), so pages are hand-added here for now — each entry is a
 * real page once added, just added by editing this file instead of a CMS.
 */

export type InfluencerBlock =
  | { type: "text"; heading?: string; body: string }
  | { type: "apps"; heading?: string; appIds: string[] };

export interface InfluencerPage {
  slug: string;
  name: string;
  tagline: string;
  avatarUrl?: string;
  blocks: InfluencerBlock[];
}

export const INFLUENCER_PAGES: InfluencerPage[] = [
  {
    slug: "example",
    name: "Example Creator",
    tagline: "A demo page showing what an influencer page can look like.",
    blocks: [
      {
        type: "text",
        heading: "Welcome",
        body: "This is a placeholder page demonstrating the influencer-page block schema — a real author will replace this once the authoring flow exists. Blocks reference real apps by id, so this list always reflects the catalog's current data.",
      },
      {
        type: "apps",
        heading: "My daily drivers",
        appIds: [
          "flatpak-flathub:org.mozilla.firefox",
          "flatpak-flathub:org.gimp.GIMP",
          "gog:firewatch",
        ],
      },
    ],
  },
];

export function getInfluencerPage(slug: string): InfluencerPage | undefined {
  return INFLUENCER_PAGES.find((page) => page.slug === slug);
}

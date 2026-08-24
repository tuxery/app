/**
 * Free-form influencer pages — a block schema referencing apps by id
 * rather than duplicating their info, per the "Influencer page" card.
 *
 * Config lives in `influencer-pages.json` (this file is just types + the
 * loader), a deliberate seam: `getInfluencerPage` is `async` and reads
 * from a config source even though that source is a static JSON import
 * today — no route loader calling it needs to change when this moves to
 * a real database later, only this file's implementation does. No
 * authoring UI exists yet either way (needs an admin/auth system that
 * doesn't exist) — pages are hand-edited in the JSON file for now.
 */

import rawPages from "./influencer-pages.json";

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

// JSON imports don't carry the discriminated-union literal types
// (`block.type` infers as `string`, not `"text" | "apps"`) — asserted
// once here rather than re-validated on every read, since this is a
// trusted, hand-edited config file, not user input.
const INFLUENCER_PAGES = rawPages as InfluencerPage[];

export async function getInfluencerPage(slug: string): Promise<InfluencerPage | undefined> {
  return INFLUENCER_PAGES.find((page) => page.slug === slug);
}

// Server-only, same split as `~/catalog` — must only ever be referenced
// inside a routeLoader$/RequestHandler `$` callback. `UNSPLASH_ACCESS_KEY`
// comes from the shared `.dev/.env` (see `vite.config.ts`), never a
// VITE_-prefixed var, so it never reaches the client bundle.

const UNSPLASH_API = "https://api.unsplash.com";

// Placeholder direction, not a final choice — a clean, dark/abstract shot
// reads well with light text over it and isn't too busy for a hero
// background. Swap freely once there's a concrete collection/series in
// mind (the original ask: "une série ou une collection Unsplash").
const HERO_QUERY = "abstract technology dark";

interface UnsplashRandomPhotoResponse {
  urls: { regular: string };
  links: { download_location: string };
  user: { name: string; links: { html: string } };
}

export interface HeroBackgroundPhoto {
  imageUrl: string;
  photographerName: string;
  photographerUrl: string;
}

// A fresh photo per page load would blow through Unsplash's demo-tier
// quota almost immediately (50 requests/hour total, shared across every
// visitor) — confirmed live while testing this feature (x-ratelimit-
// remaining: 0 after a handful of reloads). One reused photo per process
// for this long instead, same "cheap for the process's lifetime" pattern
// as ~/catalog's own DB client. Won't survive a Cloudflare Workers cold
// start/multiple isolates in production (no shared memory across them) —
// fine for now (single long-lived dev/preview process), needs a durable
// store (KV, or persisting the URL in Turso) once this ships for real.
const CACHE_TTL_MS = 30 * 60 * 1000;
let cached: { photo: HeroBackgroundPhoto | null; fetchedAt: number } | undefined;

/**
 * One random photo for the homepage hero background, reused across
 * requests for `CACHE_TTL_MS`. Degrades to `null` (no
 * `UNSPLASH_ACCESS_KEY`, network error, rate limit) rather than breaking
 * the page — a background image is a decoration, never load-bearing.
 */
export async function getHeroBackgroundPhoto(): Promise<HeroBackgroundPhoto | null> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.photo;

  const photo = await fetchHeroBackgroundPhoto();
  cached = { photo, fetchedAt: Date.now() };
  return photo;
}

async function fetchHeroBackgroundPhoto(): Promise<HeroBackgroundPhoto | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  try {
    const res = await fetch(
      `${UNSPLASH_API}/photos/random?query=${encodeURIComponent(HERO_QUERY)}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${accessKey}` } },
    );
    if (!res.ok) return null;

    const photo = (await res.json()) as UnsplashRandomPhotoResponse;

    // Required by Unsplash's API guidelines whenever a photo is actually
    // displayed, not just fetched — a fire-and-forget tracking ping, not
    // awaited, so a slow/failed call never delays the page.
    fetch(`${photo.links.download_location}&client_id=${accessKey}`).catch(() => {});

    return {
      imageUrl: photo.urls.regular,
      photographerName: photo.user.name,
      // utm params per Unsplash's attribution guidelines.
      photographerUrl: `${photo.user.links.html}?utm_source=tuxery&utm_medium=referral`,
    };
  } catch {
    return null;
  }
}

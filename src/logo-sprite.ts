// The brand logos as one SVG file of `<symbol>`s (`public/logos.svg`), which
// the repeated ones reference with `<use href="/logos.svg#slug">`. A listing
// of 24 cards drew each card's platform logos inline, ~1 KB of path data
// apiece (23 % of /browse's HTML); this way the browser fetches the paths
// once, caches them, and the page carries a few bytes per logo. Pure, so
// a test can check the committed file is the one `pnpm sync:logos` makes.

/** The sprite for `paths` (Simple Icons 24×24 `d` strings keyed by slug), in key order. */
export function logoSprite(paths: Record<string, string>): string {
  const symbols = Object.entries(paths)
    .map(([slug, d]) => `<symbol id="${slug}" viewBox="0 0 24 24"><path d="${d}"/></symbol>`)
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols}\n</svg>\n`;
}

/** Where the sprite is served from. */
export const LOGO_SPRITE_URL = "/logos.svg";

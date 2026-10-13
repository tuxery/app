// An app's brand colors (AppStream `<branding>`, `tuxery/catalog`'s
// `CatalogApp.brandColors`) as a tint behind its page header. A developer
// picks these for their own banner, not for our text on top of them, so
// each color is only used if the page's text and links stay readable on the
// tinted background: WCAG AA, 4.5:1. Pure, so it is unit-tested; the
// theme colors below are daisyUI's `nord` (light) and `dim` (dark) with
// this app's primary overrides (src/global.css), in sRGB.

export type Scheme = "light" | "dark";

/** `nord` for the light scheme, `dim` for the dark one: base background, text on it, and link (primary) color. */
export const THEME_COLORS: Record<Scheme, { base: string; text: string; link: string }> = {
  light: { base: "#eceff4", text: "#2e3440", link: "#46658e" },
  dark: { base: "#2a303c", text: "#b2ccd6", link: "#8ed5ff" },
};

/** How much of the brand color is mixed into the theme's background. The same number as the `.brand-tint-*` rules in src/global.css. */
export const TINT_PERCENT = 20;

export const MIN_CONTRAST = 4.5;

type Rgb = [number, number, number];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** A plain `#rrggbb`, nothing else: the value is put in a `style` attribute. */
export function parseHex(value: unknown): Rgb | undefined {
  if (typeof value !== "string" || !HEX_COLOR.test(value)) return undefined;
  return [1, 3, 5].map((index) => Number.parseInt(value.slice(index, index + 2), 16)) as Rgb;
}

function channel(value: number): number {
  const scaled = value / 255;
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function luminance([red, green, blue]: Rgb): number {
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

/** WCAG 2 contrast ratio, 1 to 21. */
export function contrastRatio(first: Rgb, second: Rgb): number {
  const [light, dark] = [luminance(first), luminance(second)].toSorted((a, b) => b - a);
  return ((light as number) + 0.05) / ((dark as number) + 0.05);
}

/** `percent`% of `color` over `base`, the way CSS `color-mix(in srgb, ...)` does. */
function mix(color: Rgb, base: Rgb, percent: number): Rgb {
  return color.map((value, index) =>
    Math.round((value * percent + (base[index] as number) * (100 - percent)) / 100),
  ) as Rgb;
}

/** The background a header gets for `color` in `scheme`: the brand color mixed into the theme's base. */
export function tintedBackground(color: Rgb, scheme: Scheme): Rgb {
  return mix(color, parseHex(THEME_COLORS[scheme].base) as Rgb, TINT_PERCENT);
}

/**
 * The brand color of each scheme that is safe to tint the header with:
 * a plain `#rrggbb`, and readable text and links on its tint in that
 * scheme's theme. Anything else is left out, so a page never gets a tint
 * it can't justify.
 */
export function brandTints(colors: unknown): Partial<Record<Scheme, string>> {
  const tints: Partial<Record<Scheme, string>> = {};
  if (typeof colors !== "object" || colors === null) return tints;
  for (const scheme of ["light", "dark"] as const) {
    const value = (colors as Record<string, unknown>)[scheme];
    const rgb = parseHex(value);
    if (!rgb) continue;
    const theme = THEME_COLORS[scheme];
    const background = tintedBackground(rgb, scheme);
    const readable = [theme.text, theme.link].every(
      (foreground) => contrastRatio(parseHex(foreground) as Rgb, background) >= MIN_CONTRAST,
    );
    if (readable) tints[scheme] = (value as string).toLowerCase();
  }
  return tints;
}

/** The `style` attribute value and CSS classes for a header tinted with `tints`; empty when there is none. */
export function brandTintAttributes(tints: Partial<Record<Scheme, string>>): {
  style: string | undefined;
  classes: string;
} {
  const entries = Object.entries(tints) as Array<[Scheme, string]>;
  if (entries.length === 0) return { style: undefined, classes: "" };
  return {
    style: entries.map(([scheme, color]) => `--brand-${scheme}:${color}`).join(";"),
    classes: `p-5 ${entries.map(([scheme]) => `brand-tint-${scheme}`).join(" ")}`,
  };
}

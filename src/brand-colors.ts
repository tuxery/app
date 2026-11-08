// An app's brand colors (AppStream `<branding>`, `tuxery/catalog`'s
// `CatalogApp.brandColors`) as a border on the side of its page header. Only
// a border, so a developer's color never has to suit our text: there is no
// tint behind the header to keep readable. Pure, so it is unit-tested.

export type Scheme = "light" | "dark";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * The brand color of each scheme, lowercased. Only a plain `#rrggbb`, nothing
 * else: the value is put in a `style` attribute.
 */
export function brandBorders(colors: unknown): Partial<Record<Scheme, string>> {
  const borders: Partial<Record<Scheme, string>> = {};
  if (typeof colors !== "object" || colors === null) return borders;
  for (const scheme of ["light", "dark"] as const) {
    const value = (colors as Record<string, unknown>)[scheme];
    if (typeof value === "string" && HEX_COLOR.test(value)) borders[scheme] = value.toLowerCase();
  }
  return borders;
}

/** The `style` attribute value and CSS classes for a header with `borders`; empty when there is none. */
export function brandBorderAttributes(borders: Partial<Record<Scheme, string>>): {
  style: string | undefined;
  classes: string;
} {
  const entries = Object.entries(borders) as Array<[Scheme, string]>;
  if (entries.length === 0) return { style: undefined, classes: "" };
  return {
    style: entries.map(([scheme, color]) => `--brand-${scheme}:${color}`).join(";"),
    classes: entries.map(([scheme]) => `brand-border-${scheme}`).join(" "),
  };
}

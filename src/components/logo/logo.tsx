import { BRAND_COLORS, LOGO_PATHS } from "~/data/logos";
import { LOGO_SPRITE_URL } from "~/logo-sprite";

/**
 * A project's logo from `~/data/logos`, by Simple Icons slug — decorative
 * (`aria-hidden`): whatever it sits next to names the project in text.
 * Renders nothing for an unknown or missing slug. `sprite` draws it from the
 * shared `/logos.svg` instead of inlining its path: for the logos repeated
 * on every card, where inlining weighed a fifth of a listing's HTML. Left
 * inline for the few that sit in the header, so they never wait for a file.
 */
export const Logo = ({
  slug,
  class: className,
  sprite = false,
}: {
  slug: string | undefined;
  class: string;
  sprite?: boolean;
}) => {
  const path = slug ? LOGO_PATHS[slug] : undefined;
  if (!slug || !path) return null;
  return (
    <svg viewBox="0 0 24 24" class={className} aria-hidden="true">
      {sprite ? <use href={`${LOGO_SPRITE_URL}#${slug}`} /> : <path fill="currentColor" d={path} />}
    </svg>
  );
};

/**
 * A logo in its brand color on a small white chip, the same in both themes
 * (a black or pale brand color would vanish on one of them). Decorative,
 * like `Logo`.
 */
export const LogoChip = ({
  slug,
  size = "md",
}: {
  slug: string | undefined;
  size?: "sm" | "md";
}) => (
  <span
    class={[
      "shrink-0 rounded-field bg-white inline-flex items-center justify-center shadow-sm ring-1 ring-black/5",
      size === "sm" ? "size-7" : "size-9",
    ]}
    style={{ color: (slug && BRAND_COLORS[slug]) || "#2e3440" }}
  >
    <Logo slug={slug} class={size === "sm" ? "size-4" : "size-5"} />
  </span>
);

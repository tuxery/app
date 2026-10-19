import { LOGO_PATHS } from "~/data/logos";
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

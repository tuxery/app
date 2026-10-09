import { LOGO_PATHS } from "~/data/logos";

/**
 * A project's logo from `~/data/logos`, by Simple Icons slug — decorative
 * (`aria-hidden`): whatever it sits next to names the project in text.
 * Renders nothing for an unknown or missing slug.
 */
export const Logo = ({ slug, class: className }: { slug: string | undefined; class: string }) => {
  const path = slug ? LOGO_PATHS[slug] : undefined;
  if (!path) return null;
  return (
    <svg viewBox="0 0 24 24" class={className} aria-hidden="true">
      <path fill="currentColor" d={path} />
    </svg>
  );
};

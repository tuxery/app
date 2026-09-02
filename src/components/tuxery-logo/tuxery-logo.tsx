import { component$, useId } from "@builder.io/qwik";

/**
 * The brand mark: a penguin silhouette (Linux/Tux) whose belly doubles as a
 * magnifying glass (search-first) — negative space already needed for a
 * two-tone penguin, so the search cue costs nothing extra. Lens kept
 * centered on the body's own axis with a short handle nub rather than a
 * long diagonal arm — an off-center lens read as a lopsided white patch at
 * small sizes (favicon, mobile nav) once the handle itself became too
 * small to resolve; centering keeps the shape looking intentional even
 * when the handle disappears. Gradient (not a flat color) stands in for
 * "many distros, one place" — picked over flat color-blocked regions,
 * which read busier at a glance.
 *
 * `currentColor`-free by design: the belly/lens cutout must match
 * whatever's behind the mark (page background in the header, footer
 * background in the footer) so it reads as a cutout rather than a visible
 * patch — pass `cutoutColor` as a CSS color (a literal, or a `var(...)`
 * referencing the current daisyUI theme's own token) rather than assuming
 * one surface.
 */
export const TuxeryLogo = component$<{ size?: number; cutoutColor: string }>(
  ({ size = 24, cutoutColor }) => {
    const gradientId = `tuxery-logo-gradient-${useId()}`;

    return (
      <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient
            id={gradientId}
            x1="20"
            y1="10"
            x2="180"
            y2="190"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stop-color="#18B6F6" />
            <stop offset="38%" stop-color="#8B5CF6" />
            <stop offset="70%" stop-color="#F0637C" />
            <stop offset="100%" stop-color="#F2A94A" />
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="118" rx="52" ry="62" fill={`url(#${gradientId})`} />
        <circle cx="100" cy="56" r="36" fill={`url(#${gradientId})`} />
        <ellipse
          cx="46"
          cy="105"
          rx="14"
          ry="30"
          fill={`url(#${gradientId})`}
          transform="rotate(-18 46 105)"
        />
        <ellipse
          cx="154"
          cy="105"
          rx="14"
          ry="30"
          fill={`url(#${gradientId})`}
          transform="rotate(18 154 105)"
        />
        <circle cx="100" cy="110" r="27" fill={cutoutColor} />
        <line
          x1="120"
          y1="128"
          x2="132"
          y2="140"
          stroke={cutoutColor}
          stroke-width="14"
          stroke-linecap="round"
        />
      </svg>
    );
  },
);

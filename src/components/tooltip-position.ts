// Full literal class names, not a template-interpolated `tooltip-${...}` —
// Tailwind's static scanner needs each one spelled out verbatim in the
// source to generate its CSS at all. Shared by every component with a
// hover tooltip whose side needs to adapt to its surrounding layout (a
// card near the bottom of its row wants "top", a heading near the top of
// the page wants "bottom", ...).
export const TOOLTIP_POSITION_CLASSES = {
  top: "tooltip-top",
  bottom: "tooltip-bottom",
  right: "tooltip-right",
} as const;

export type TooltipPosition = keyof typeof TOOLTIP_POSITION_CLASSES;

/**
 * The full class list for a hover tooltip, shared by every component that
 * pairs a native `title` with a fast CSS `.tooltip`/`data-tip` (`SourceMap`,
 * `ChannelIndicator`, `UnifiedRating`) — `before:whitespace-pre-wrap
 * before:text-left` lets a multi-item tip (comma-joined sources/channels)
 * wrap onto several lines instead of one unreadable strip. `extra` adds
 * each component's own layout classes on top.
 */
export function tooltipClass(position: TooltipPosition, extra = ""): string {
  return `tooltip ${TOOLTIP_POSITION_CLASSES[position]} before:whitespace-pre-wrap before:text-left ${extra}`.trim();
}

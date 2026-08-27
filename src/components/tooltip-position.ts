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

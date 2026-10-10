import { $, component$, Slot, useId, useSignal } from "@qwik.dev/core";

export type TipPlacement = "top" | "bottom";

export interface HoverTipProps {
  /** The tooltip's text; newlines start new lines. */
  text: string;
  /** Preferred side; flips when there's no room. */
  placement?: TipPlacement;
  /**
   * Whether the trigger takes keyboard focus to show the tip. Off inside a
   * link (an app card), where a focusable child would nest interactive
   * elements — there the text still reaches screen readers (see below).
   */
  focusable?: boolean;
  class?: string;
}

const GAP = 6;
const EDGE = 8;

/**
 * A hover/focus tooltip shown in the browser's top layer (Popover API) and
 * positioned against its trigger — never clipped. daisyUI's CSS tooltip
 * (`.tooltip` + `data-tip`) draws inside its ancestors, so app cards
 * (`overflow: hidden`) and horizontal rows (`overflow-x: auto`, which
 * clips vertically too) cut it off. The text is also in a visually hidden
 * span, so screen readers get it whether or not the popup is shown.
 */
export const HoverTip = component$<HoverTipProps>(
  ({ text, placement = "top", focusable = false, class: className }) => {
    const id = useId();
    const anchor = useSignal<HTMLElement>();
    const popup = useSignal<HTMLElement>();

    const show = $(() => {
      const trigger = anchor.value;
      const tip = popup.value;
      if (!trigger || !tip || typeof tip.showPopover !== "function") return;
      tip.showPopover();
      const box = trigger.getBoundingClientRect();
      const size = tip.getBoundingClientRect();
      const left = Math.min(
        Math.max(EDGE, box.left + box.width / 2 - size.width / 2),
        window.innerWidth - size.width - EDGE,
      );
      const above = box.top - size.height - GAP;
      const below = box.bottom + GAP;
      const fitsAbove = above >= EDGE;
      const fitsBelow = below + size.height <= window.innerHeight - EDGE;
      const top = placement === "top" ? (fitsAbove ? above : below) : fitsBelow ? below : above;
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
    });

    const hide = $(() => {
      const tip = popup.value;
      if (tip && typeof tip.hidePopover === "function" && tip.matches(":popover-open")) {
        tip.hidePopover();
      }
    });

    const popupEl = (
      <span
        ref={popup}
        id={id}
        popover="manual"
        role="tooltip"
        aria-hidden={focusable ? undefined : "true"}
        class="m-0 fixed inset-auto max-w-72 whitespace-pre-line rounded-field bg-neutral px-2 py-1 text-left text-xs leading-snug text-neutral-content shadow-lg pointer-events-none"
      >
        {text}
      </span>
    );

    // Focusable: a real button, described by the tip. Otherwise (inside a
    // card's link) a plain span, the text in a visually hidden copy.
    // The popup sits next to the button, not inside it, so its text isn't
    // read as part of the button's name (it describes it instead).
    return focusable ? (
      <span class={["inline-flex", className]}>
        <button
          ref={anchor}
          type="button"
          class="inline-flex cursor-default rounded-field"
          aria-describedby={id}
          onMouseEnter$={show}
          onMouseLeave$={hide}
          onFocus$={show}
          onBlur$={hide}
        >
          <Slot />
        </button>
        {popupEl}
      </span>
    ) : (
      <span
        ref={anchor}
        class={["inline-flex", className]}
        onMouseEnter$={show}
        onMouseLeave$={hide}
      >
        <Slot />
        <span class="sr-only">{text}</span>
        {popupEl}
      </span>
    );
  },
);

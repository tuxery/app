import { component$, sync$, useOnDocument, type JSXOutput } from "@qwik.dev/core";

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
  children?: JSXOutput;
}

/**
 * A hover/focus tooltip shown in the browser's top layer (Popover API) and
 * positioned against its trigger — never clipped. daisyUI's CSS tooltip
 * (`.tooltip` + `data-tip`) draws inside its ancestors, so app cards
 * (`overflow: hidden`) and horizontal rows (`overflow-x: auto`, which
 * clips vertically too) cut it off.
 *
 * Only a marker: the trigger carries its text in `data-hovertip`, and the
 * one `HoverTipHost` in the layout shows it. A homepage or a listing has a
 * few hundred of these, so each used to cost a component instance, two
 * signals and three listeners; now it costs two attributes, and nothing
 * loads until the first hover. Screen readers get the text whether or not
 * the popup is shown, as a visually hidden copy inside the trigger.
 */
export const HoverTip = ({
  text,
  placement = "top",
  focusable = false,
  class: className,
  children,
}: HoverTipProps) =>
  focusable ? (
    <span class={["inline-flex", className]}>
      <button
        type="button"
        class="inline-flex cursor-default rounded-field"
        data-hovertip={text}
        data-hovertip-placement={placement}
      >
        {children}
        <span class="sr-only">{text}</span>
      </button>
    </span>
  ) : (
    <span
      class={["inline-flex", className]}
      data-hovertip={text}
      data-hovertip-placement={placement}
    >
      {children}
      <span class="sr-only">{text}</span>
    </span>
  );

// The popup's id, for the handlers below (they are serialized into the page
// as plain functions, so they can't share a constant with this module).
const POPUP_ID = "hovertip";

/**
 * The one popup every `HoverTip` shares, and the document listeners that
 * move it. Mounted once, in the layout. The handlers are `sync$`: inlined in
 * the page, so a tip shows on the very first hover instead of after a chunk
 * has loaded, and they must stay self-contained (no imports, no closure).
 */
export const HoverTipHost = component$(() => {
  const show = sync$((event: Event) => {
    const gap = 6;
    const edge = 8;
    const trigger = (event.target as Element | null)?.closest?.(
      "[data-hovertip]",
    ) as HTMLElement | null;
    const tip = document.getElementById("hovertip") as
      | (HTMLElement & { tuxeryTipFor?: Element })
      | null;
    if (!trigger || !tip || typeof tip.showPopover !== "function") return;
    if (tip.tuxeryTipFor === trigger && tip.matches(":popover-open")) return;
    tip.tuxeryTipFor = trigger;
    tip.textContent = trigger.dataset.hovertip ?? "";
    if (!tip.matches(":popover-open")) tip.showPopover();
    const box = trigger.getBoundingClientRect();
    const size = tip.getBoundingClientRect();
    const left = Math.min(
      Math.max(edge, box.left + box.width / 2 - size.width / 2),
      window.innerWidth - size.width - edge,
    );
    const above = box.top - size.height - gap;
    const below = box.bottom + gap;
    const fitsAbove = above >= edge;
    const fitsBelow = below + size.height <= window.innerHeight - edge;
    const top =
      trigger.dataset.hovertipPlacement === "bottom"
        ? fitsBelow
          ? below
          : above
        : fitsAbove
          ? above
          : below;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  });
  const hide = sync$((event: Event) => {
    const trigger = (event.target as Element | null)?.closest?.("[data-hovertip]");
    if (!trigger) return;
    // Moving between two children of the same trigger isn't leaving it.
    const next = (event as MouseEvent).relatedTarget as Node | null;
    if (next && trigger.contains(next)) return;
    const tip = document.getElementById("hovertip") as
      | (HTMLElement & { tuxeryTipFor?: Element })
      | null;
    if (tip && typeof tip.hidePopover === "function" && tip.matches(":popover-open")) {
      tip.hidePopover();
      tip.tuxeryTipFor = undefined;
    }
  });
  useOnDocument("mouseover", show);
  useOnDocument("mouseout", hide);
  useOnDocument("focusin", show);
  useOnDocument("focusout", hide);

  return (
    <span
      id={POPUP_ID}
      popover="manual"
      role="tooltip"
      aria-hidden="true"
      class="m-0 fixed inset-auto max-w-72 whitespace-pre-line rounded-field bg-neutral px-2 py-1 text-left text-xs leading-snug text-neutral-content shadow-lg pointer-events-none"
    />
  );
});

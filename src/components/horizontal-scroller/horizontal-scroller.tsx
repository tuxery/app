import { component$, Slot, useSignal } from "@builder.io/qwik";
import { LuChevronLeft, LuChevronRight } from "@qwikest/icons/lucide";

/**
 * A single row of items, scrolled by drag/wheel/touch or the arrow buttons —
 * no page-based slicing. Replaces the previous pattern of mixing a fixed-size
 * horizontal-scroll row with separate prev/next page buttons that swapped the
 * data underneath it (confusing: two different ways to move, out of sync
 * with each other). Children should carry `snap-start` themselves (see
 * `AppCardLink` in `routes/index.tsx`) so they align with this container's
 * `snap-x`.
 */
export const HorizontalScroller = component$<{ ariaLabel: string }>(({ ariaLabel }) => {
  const trackRef = useSignal<HTMLElement>();

  return (
    <div class="relative">
      <div
        ref={trackRef}
        aria-label={ariaLabel}
        class="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1"
      >
        <Slot />
      </div>
      <button
        type="button"
        class="btn btn-circle btn-sm absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-md hidden sm:inline-flex"
        aria-label={`Scroll ${ariaLabel} left`}
        onClick$={() => {
          const el = trackRef.value;
          el?.scrollBy({ left: -el.clientWidth * 0.8, behavior: "smooth" });
        }}
      >
        <LuChevronLeft />
      </button>
      <button
        type="button"
        class="btn btn-circle btn-sm absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 shadow-md hidden sm:inline-flex"
        aria-label={`Scroll ${ariaLabel} right`}
        onClick$={() => {
          const el = trackRef.value;
          el?.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
        }}
      >
        <LuChevronRight />
      </button>
    </div>
  );
});

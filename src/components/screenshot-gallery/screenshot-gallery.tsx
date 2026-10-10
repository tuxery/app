import { $, component$, useSignal } from "@qwik.dev/core";
import { LuChevronLeft, LuChevronRight, LuX } from "@qwikest/icons/lucide";

/**
 * The product page's screenshot row, each thumbnail opening a full-size
 * viewer: a native `<dialog>` (focus trapped, Escape closes it for free)
 * with previous/next buttons and arrow keys. Thumbnails are buttons, so
 * the row is reachable and scrollable from the keyboard too — it wasn't
 * before (a gap listed in the accessibility statement).
 */
export const ScreenshotGallery = component$<{ screenshots: string[]; appName: string }>(
  ({ screenshots, appName }) => {
    const dialog = useSignal<HTMLDialogElement>();
    const index = useSignal(0);
    const count = screenshots.length;

    const open = $((i: number) => {
      index.value = i;
      dialog.value?.showModal();
    });
    const step = $((delta: number) => {
      index.value = (index.value + delta + count) % count;
    });

    return (
      <>
        {screenshots.map((src, i) => (
          <button
            key={src}
            type="button"
            class="shrink-0 rounded-box overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-content cursor-zoom-in"
            aria-label={`Open screenshot ${i + 1} of ${count} of ${appName}`}
            onClick$={() => open(i)}
          >
            <img src={src} alt="" class="h-48 rounded-box" />
          </button>
        ))}

        <dialog
          ref={dialog}
          class="modal"
          aria-label={`${appName} screenshots`}
          onKeyDown$={(event) => {
            if (event.key === "ArrowRight") step(1);
            if (event.key === "ArrowLeft") step(-1);
          }}
        >
          <div class="modal-box w-auto max-w-[95vw] p-2 flex flex-col items-center gap-2 bg-base-100">
            <img
              src={screenshots[index.value]}
              alt={`Screenshot ${index.value + 1} of ${count} of ${appName}`}
              class="max-h-[80vh] max-w-full rounded-box object-contain"
            />
            <div class="flex items-center gap-3">
              {count > 1 && (
                <button
                  type="button"
                  class="btn btn-ghost btn-sm btn-square"
                  aria-label="Previous screenshot"
                  onClick$={() => step(-1)}
                >
                  <LuChevronLeft class="text-lg" />
                </button>
              )}
              <span class="text-sm text-base-content/70" aria-live="polite">
                {index.value + 1} / {count}
              </span>
              {count > 1 && (
                <button
                  type="button"
                  class="btn btn-ghost btn-sm btn-square"
                  aria-label="Next screenshot"
                  onClick$={() => step(1)}
                >
                  <LuChevronRight class="text-lg" />
                </button>
              )}
              <form method="dialog">
                <button type="submit" class="btn btn-ghost btn-sm gap-1">
                  <LuX class="text-base" />
                  Close
                </button>
              </form>
            </div>
          </div>
          {/* Clicking the backdrop closes it too. */}
          <form method="dialog" class="modal-backdrop">
            <button type="submit" aria-label="Close">
              close
            </button>
          </form>
        </dialog>
      </>
    );
  },
);

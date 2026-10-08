import { component$ } from "@qwik.dev/core";
import { useNavigate } from "@qwik.dev/router";
import type { Risk } from "~/catalog-types";
import { buildPath, selectEdition, type BuildOption, type BuildSelection } from "~/product-builds";

export interface BuildSelectorsProps {
  appId: string;
  selection: BuildSelection;
  /** Every edition of the product — see `editionsOf`. */
  editions: BuildOption<string | undefined>[];
  /** Each edition's versions, keyed by its track (`""` for Standard) — see `versionsOf`. */
  versionsByEdition: Record<string, BuildOption<Risk | undefined>[]>;
  /** `lg` sits next to the page title, `sm` in the sticky header. */
  size: "sm" | "lg";
}

const SIZE_CLASS = {
  sm: "select select-ghost select-sm w-auto",
  lg: "select select-ghost w-auto text-lg font-semibold",
};

/**
 * Edition (catalog's track) and version (catalog's risk) pickers for a
 * product page — each only when there's more than one choice, so most
 * apps show neither. Picking one navigates to that combination's own URL
 * (`buildPath`), keeping the version when the new edition has it.
 */
export const BuildSelectors = component$<BuildSelectorsProps>(
  ({ appId, selection, editions, versionsByEdition, size }) => {
    const nav = useNavigate();
    const versions = versionsByEdition[selection.track ?? ""] ?? [];
    if (editions.length < 2 && versions.length < 2) return null;

    return (
      <div class="flex flex-wrap items-center gap-1">
        {editions.length > 1 && (
          <select
            class={SIZE_CLASS[size]}
            aria-label="Edition"
            value={selection.track ?? ""}
            onChange$={(_, element) =>
              nav(
                buildPath(
                  appId,
                  selectEdition(versionsByEdition, element.value || undefined, selection),
                ),
              )
            }
          >
            {editions.map((edition) => (
              // `selected`, not only the select's `value`: server-rendered
              // HTML has no select value, so the page would load showing the
              // first option whatever the URL says.
              <option
                key={edition.value ?? ""}
                value={edition.value ?? ""}
                selected={edition.value === selection.track}
              >
                {edition.label}
              </option>
            ))}
          </select>
        )}
        {versions.length > 1 && (
          <select
            class={SIZE_CLASS[size]}
            aria-label="Version"
            value={selection.risk ?? ""}
            onChange$={(_, element) =>
              nav(
                buildPath(appId, {
                  track: selection.track,
                  risk: (element.value || undefined) as Risk | undefined,
                }),
              )
            }
          >
            {versions.map((version) => (
              <option
                key={version.value ?? ""}
                value={version.value ?? ""}
                selected={version.value === selection.risk}
              >
                {version.label}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  },
);

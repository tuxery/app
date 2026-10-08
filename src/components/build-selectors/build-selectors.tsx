import { component$ } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";
import { LuChevronDown } from "@qwikest/icons/lucide";
import type { Risk } from "~/catalog-types";
import { buildPath, selectEdition, type BuildOption, type BuildSelection } from "~/product-builds";

export interface BuildSelectorsProps {
  appId: string;
  selection: BuildSelection;
  /** Every edition of the product — see `editionsOf`. */
  editions: BuildOption<string | undefined>[];
  /** Each edition's versions, keyed by its track (`""` for Standard) — see `versionsOf`. */
  versionsByEdition: Record<string, BuildOption<Risk | undefined>[]>;
  /** `lg` sits next to the page title, with a caption; `sm` in the sticky header, value only. */
  size: "sm" | "lg";
}

interface PickerProps {
  caption: string;
  current: string;
  /** The other choices, each with the URL of the combination it leads to. */
  others: { label: string; href: string }[];
  size: "sm" | "lg";
}

/**
 * One choice shown as plain text (caption + current value + chevron) that
 * opens a menu of links to the other choices — not a `<select>`: a native
 * one is too heavy next to a title, and a link per combination needs no
 * client state (each combination is its own page, see `buildPath`).
 */
const Picker = component$<PickerProps>(({ caption, current, others, size }) => (
  <div class="dropdown">
    <div
      tabIndex={0}
      role="button"
      aria-label={`${caption}: ${current}`}
      aria-haspopup="menu"
      class={[
        "inline-flex items-center gap-1.5 rounded-field cursor-pointer hover:bg-base-content/5",
        size === "lg" ? "px-2 py-1" : "px-1.5 py-0.5 text-sm",
      ]}
    >
      {size === "lg" && (
        <span class="text-[10px] uppercase tracking-wide text-base-content/50">{caption}</span>
      )}
      <span class={size === "lg" ? "text-base font-semibold" : "font-medium"}>{current}</span>
      <LuChevronDown class="text-xs text-base-content/50" />
    </div>
    <ul
      tabIndex={0}
      role="menu"
      class="dropdown-content menu menu-sm z-40 mt-1 w-max min-w-36 rounded-box bg-base-100 p-1 shadow-lg"
    >
      {others.map((other) => (
        <li key={other.href} role="none">
          <Link role="menuitem" href={other.href}>
            {other.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
));

/**
 * Edition (catalog's track) and version (catalog's risk) pickers for a
 * product page — each only when there's more than one choice, so most
 * apps show neither. Every choice links to that combination's own URL,
 * keeping the version when the new edition has it.
 */
export const BuildSelectors = component$<BuildSelectorsProps>(
  ({ appId, selection, editions, versionsByEdition, size }) => {
    const versions = versionsByEdition[selection.track ?? ""] ?? [];
    if (editions.length < 2 && versions.length < 2) return null;

    const currentEdition = editions.find((edition) => edition.value === selection.track);
    const currentVersion = versions.find((version) => version.value === selection.risk);

    return (
      <div class={["flex flex-wrap items-center", size === "lg" ? "gap-1 ml-1" : "gap-0.5 ml-2"]}>
        {editions.length > 1 && currentEdition && (
          <Picker
            caption="Edition"
            current={currentEdition.label}
            size={size}
            others={editions
              .filter((edition) => edition !== currentEdition)
              .map((edition) => ({
                label: edition.label,
                href: buildPath(appId, selectEdition(versionsByEdition, edition.value, selection)),
              }))}
          />
        )}
        {versions.length > 1 && currentVersion && (
          <Picker
            caption="Version"
            current={currentVersion.label}
            size={size}
            others={versions
              .filter((version) => version !== currentVersion)
              .map((version) => ({
                label: version.label,
                href: buildPath(appId, { track: selection.track, risk: version.value }),
              }))}
          />
        )}
      </div>
    );
  },
);

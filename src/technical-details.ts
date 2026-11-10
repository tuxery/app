// The numbers a person weighing an install wants next to the version:
// how much it downloads, how much room it takes once installed, and for
// which CPUs. They come from the packages themselves, each source's own
// figure, so the page shows them per source group rather than one merged
// number: a Flatpak's download leaves out its runtime, a distro package's
// installed size leaves out its dependencies, and neither is the other.

import type { SourcedPackage } from "~/catalog-types";

export interface InstalledSize {
  /** The source group (as `SOURCE_GROUP_MEMBERS` names it) and its largest package's installed size. */
  group: string;
  bytes: number;
}

/** Installed sizes, one per source group, smallest first. A group's figure is its largest package: the app itself, not the language or data packages split off it. */
export function installedSizes(groups: [string, SourcedPackage[]][]): InstalledSize[] {
  return groups
    .flatMap(([group, packages]) => {
      const bytes = Math.max(0, ...packages.map((pkg) => pkg.installedSizeBytes ?? 0));
      return bytes > 0 ? [{ group, bytes }] : [];
    })
    .toSorted((a, b) => a.bytes - b.bytes);
}

/** The CPU architectures the sources list for these packages (`x86_64`, `aarch64`), sorted, without duplicates. Empty when no source says: many fetch a single architecture, so this is "listed as", never "only runs on". */
export function architectures(packages: SourcedPackage[]): string[] {
  return [...new Set(packages.flatMap((pkg) => (pkg.arch ? [pkg.arch] : [])))].toSorted();
}

/** The desktop each Flatpak runtime family belongs to, by runtime id (an SDK used as a runtime counts as its platform). */
const RUNTIME_FAMILIES: Record<string, string> = {
  "org.freedesktop.Platform": "Freedesktop",
  "org.freedesktop.Sdk": "Freedesktop",
  "org.gnome.Platform": "GNOME",
  "org.gnome.Sdk": "GNOME",
  "org.kde.Platform": "KDE",
  "org.kde.Sdk": "KDE",
  "io.elementary.Platform": "elementary",
  "io.elementary.Sdk": "elementary",
};

/** A runtime ref as people name it: `org.gnome.Platform//51` gives "GNOME 51"; an unknown id keeps its own name. */
export function runtimeLabel(runtime: string): string {
  const [id = runtime, branch] = runtime.split("//");
  const name = RUNTIME_FAMILIES[id] ?? id;
  return branch ? `${name} ${branch}` : name;
}

/** The Flatpak runtimes these packages run on, labelled, without duplicates (a beta build may run on a newer one). Empty for any other format. */
export function flatpakRuntimes(packages: SourcedPackage[]): string[] {
  return [
    ...new Set(packages.flatMap((pkg) => (pkg.runtime ? [runtimeLabel(pkg.runtime)] : []))),
  ].toSorted((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

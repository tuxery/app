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
    .sort((a, b) => a.bytes - b.bytes);
}

/** The CPU architectures the sources list for these packages (`x86_64`, `aarch64`), sorted, without duplicates. Empty when no source says: many fetch a single architecture, so this is "listed as", never "only runs on". */
export function architectures(packages: SourcedPackage[]): string[] {
  return [...new Set(packages.flatMap((pkg) => (pkg.arch ? [pkg.arch] : [])))].sort();
}

// Client-safe half of the catalog layer: pure types/constants only, no
// `@libsql/client` import. Components rendered on the client (AppCard, the
// detail page's badges, ...) must import from here, never from `~/catalog`
// directly — that file's top-level `createClient` import drags the Node-only
// libsql driver into the client bundle the moment anything in it is
// referenced outside a routeLoader$/RequestHandler `$` boundary (this split
// exists because that exact mistake broke `pnpm build`).
//
// Mirrors `tuxery/catalog`'s dataset shape — packages/sources/src/types.ts
// (`PackageSourceId`, `SourcedPackage`) and packages/curator/src/enrich/types.ts
// (`CatalogApp`) plus packages/store/src/turso-client.ts (the `apps` table
// columns). No cross-repo import exists (separate repos, not a monorepo), so
// this is kept in sync by hand — see those files for field-by-field notes on
// what's actually populated today vs. typed for later.

// One id per connector folder under catalog's packages/sources/src/.
export type PackageSourceId =
  | "flathub"
  | "snapcraft"
  | "appimage"
  | "aur"
  | "debian"
  | "ubuntu"
  | "fedora"
  | "arch";

export const SOURCE_LABELS: Record<PackageSourceId, string> = {
  flathub: "Flathub (Flatpak)",
  snapcraft: "Snap Store",
  appimage: "AppImage",
  aur: "AUR",
  debian: "Debian",
  ubuntu: "Ubuntu",
  fedora: "Fedora",
  arch: "Arch Linux",
};

export interface SourcedPackage {
  source: PackageSourceId;
  name: string;
  description: string;
  version: string;
  appId?: string;
  iconFilename?: string;
  channel?: string;
  homepage?: string;
}

export interface CatalogApp {
  id: string;
  name: string;
  shortDescription: string;
  homepage?: string;
  packages: SourcedPackage[];
  /** "gui" when the catalog has positive evidence of a launchable GUI app — never "cli" by default, see `tuxery/catalog`'s `CatalogApp.kind` doc comment. */
  kind?: "gui";
  iconUrl?: string;
  longDescription?: string;
  category?: string;
  developer?: string;
  publisher?: string;
  license?: string;
  languages?: string[];
  approxSizeBytes?: number;
  screenshots?: string[];
  videos?: string[];
  rating?: { average: number; count: number };
  reviews?: Array<{ author: string; text: string; rating: number }>;
  features?: string[];
  changelog?: string;
  requirements?: string;
  permissions?: string[];
  ageRating?: { system: string; value: string };
  aiFeatures?: boolean;
  inAppPurchases?: boolean;
  gdprCompliant?: boolean;
  editorialTags?: string[];
}

/** The subset of `CatalogApp` a search result card needs — cheap to select and stream in bulk, unlike the full row. */
export interface AppSummary {
  id: string;
  name: string;
  shortDescription: string;
  iconUrl?: string;
  kind?: "gui";
  sources: PackageSourceId[];
}

export interface CatalogStats {
  total: number;
  generatedAt: string;
}

export const EMPTY_STATS: CatalogStats = { total: 0, generatedAt: "" };

export const BROWSE_PAGE_SIZE = 30;

export interface BrowseResult {
  apps: AppSummary[];
  total: number;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { routeLoader$, useLocation } from "@qwik.dev/router";
import type { DocumentHead } from "@qwik.dev/router";
import { unique } from "helpers4/array";
import {
  LuBadgeCheck,
  LuCheck,
  LuDownload,
  LuExternalLink,
  LuFlag,
  LuHistory,
  LuPackage,
  LuAlertTriangle,
} from "@qwikest/icons/lucide";
import {
  compactCount,
  confidenceNotes,
  formatReleaseDate,
  releaseAge,
  storePicks,
} from "~/app-facts";
import { classifyLicense, licenseInfoHref } from "~/license";
import { isCatalogUnavailable } from "~/catalog-status";
import { useCatalogUnavailable } from "~/routes/layout";
import { reportDataProblemUrl } from "~/contribute-links";
import { getAppById, getAppsByCategory, getAppsByIds, getStats } from "~/catalog";
import { resolveServerEnv } from "~/server-env";
import {
  ALL_SOURCE_GROUPS,
  buildLabel,
  formatBytes,
  formatSourceLabel,
  availableViaLabels,
  isInstallSource,
  isVerifiedPackage,
  provenanceInfo,
  SOURCE_GROUP_MEMBERS,
  SOURCE_LABELS,
  summarizeReleaseLines,
  summarizeRatingsBySource,
  verifiedSourcesOf,
  type AppSummary,
  type CatalogApp,
  type Companion,
  type CompanionKind,
  type PackageSourceId,
  type Relation,
  type SourcedPackage,
} from "~/catalog-types";
import { BuildIndicator } from "~/components/build-indicator/build-indicator";
import { BuildSelectors } from "~/components/build-selectors/build-selectors";
import {
  buildPath,
  defaultSelection,
  editionsOf,
  buildFacts,
  hasBuild,
  otherSelections,
  packagesOf,
  parseBuildPath,
  selectionLabel,
  versionsByEdition,
  type BuildSelection,
} from "~/product-builds";
import { SourceStack } from "~/components/source-stack/source-stack";
import { AppCardLink } from "~/components/app-card/app-card";
import { HorizontalScroller } from "~/components/horizontal-scroller/horizontal-scroller";
import { ScreenshotGallery } from "~/components/screenshot-gallery/screenshot-gallery";
import { UnifiedRating } from "~/components/unified-rating/unified-rating";
import {
  INSTALL_METHODS,
  installCommand,
  installDeepLink,
  installWebsiteLink,
} from "~/install-methods";
import { findOsEntry, recommendedGroupIds } from "~/os-catalog";
import {
  isGroupEffectivelyShown,
  isRepoEffectivelyActivated,
  setSourceActivated,
  useSettings,
  type InstallFormatGroup,
  type SpecialRepoOption,
} from "~/settings";

export const useApp = routeLoader$(async (requestEvent): Promise<CatalogApp | null> => {
  const id = decodeURIComponent(requestEvent.params.id ?? "");
  const app = await getAppById(resolveServerEnv(requestEvent.platform), id);
  // During an outage the layout already answered 503: missing here means
  // "couldn't load", not "doesn't exist".
  if (!app && !isCatalogUnavailable(requestEvent.sharedMap)) requestEvent.status(404);
  return app;
});

/**
 * Cards for the product's related apps (its catalog relations, by id) and
 * a "similar apps" row: the most popular apps of the same category, from
 * the list catalog precomputes per category — no live query. None for
 * "To Classify", which isn't a real category.
 */
export const useRelatedApps = routeLoader$(async (requestEvent) => {
  const app = await requestEvent.resolveValue(useApp);
  if (!app) return { related: [] as AppSummary[], similar: [] as AppSummary[] };
  const env = resolveServerEnv(requestEvent.platform);
  const relatedIds = unique((app.relations ?? []).map((relation) => relation.app.id));
  const [related, inCategory] = await Promise.all([
    relatedIds.length > 0 ? getAppsByIds(env, relatedIds) : Promise.resolve([]),
    app.category && app.category !== "To Classify"
      ? getAppsByCategory(env, app.category, 24)
      : Promise.resolve([]),
  ]);
  const similar = inCategory
    .filter((other) => other.id !== app.id && !relatedIds.includes(other.id))
    .slice(0, 12);
  return { related, similar };
});

/**
 * The edition/version combination the path names (`/app/firefox/esr/beta/`,
 * see `parseBuildPath`). A path naming no combination this product has —
 * a stale link, a typo — redirects to the product's own page.
 */
export const useBuildSelection = routeLoader$(async (requestEvent): Promise<BuildSelection> => {
  const app = await requestEvent.resolveValue(useApp);
  const parsed = parseBuildPath((requestEvent.params.build ?? "").split("/"));
  if (!app) return parsed ?? {};
  // `/app/<id>/` shows the product's default combination, which isn't
  // Standard · Stable for a product published only as a nightly or git
  // build (`defaultSelection`) — redirecting it to itself looped.
  const selection =
    parsed && !parsed.track && !parsed.risk ? defaultSelection(app.packages) : parsed;
  if (!selection || !hasBuild(app.packages, selection)) {
    throw requestEvent.redirect(302, buildPath(app.id, {}));
  }
  return selection;
});

export const useDetailStats = routeLoader$(async (requestEvent) =>
  getStats(resolveServerEnv(requestEvent.platform)),
);

// Only the special repos precise enough to know exactly which package
// needs them — each maps to the settings.ts leaf whose "activated" flag
// governs it, so showing the setup step on that source's install row is
// never a guess. Universe/non-oss aren't here: they apply to *some*
// packages from a source shared with packages that don't need them
// (deb-ubuntu, rpm-opensuse), so they only ever show generically on the
// Settings page — see settings.ts. `appimage`/`appimage-manual` both
// point at the same leaf — the "do you have a desktop-integration tool"
// question doesn't depend on which of the two AppImage feeds a package
// came from.
// The "Additional information" cards.
const INFO_CARD = "rounded-box border border-base-300 bg-base-100/70 p-4";
const INFO_CARD_TITLE = "text-xs font-semibold uppercase tracking-wide text-base-content/70 mb-3";
const INFO_LIST = "flex flex-col gap-3 text-sm";
const INFO_LABEL = "text-xs text-base-content/70";

const PACKAGE_SOURCE_TO_LEAF_ID: Partial<Record<PackageSourceId, string>> = {
  "flatpak-flathub": "flathub",
  "flatpak-appcenter": "elementary-appcenter",
  "snap-snapcraft": "snap-store",
  appimage: "appimage-integration",
  "appimage-manual": "appimage-integration",
  "pacman-aur": "arch-aur",
  "rpm-rpmfusion": "rpmfusion",
};

/**
 * `SOURCE_LABELS` fully qualifies each source ("Flathub (Flatpak)", "AUR"
 * ...) so it reads correctly standalone elsewhere (Settings, Browse's
 * filter badge) — but inside a `SourceGroupSection`, the platform/distro
 * group heading (e.g. "Flatpak", "Arch Linux") already says that part,
 * so repeating it in `SourceInstallUnit`'s own label is pure redundancy.
 * Only the sources that actually need disambiguating from a sibling in
 * the same group get an entry here; everything else's `SOURCE_LABELS`
 * value was already short/distinct enough (e.g. "AUR", "RPM Fusion").
 */
const SHORT_SOURCE_LABELS: Partial<Record<PackageSourceId, string>> = {
  "flatpak-flathub": "Flathub",
  "flatpak-appcenter": "elementary AppCenter",
  appimage: "Community feed",
  "appimage-manual": "Direct download",
  "pacman-arch": "Official",
  "rpm-fedora": "Official",
};

function findSourceOption(
  installGroups: InstallFormatGroup[],
  leafId: string,
): SpecialRepoOption | undefined {
  for (const group of installGroups) {
    const found = group.specialRepos.find((repo) => repo.id === leafId);
    if (found) return found;
  }
  return undefined;
}

/** True unless the user hid this source's platform/distro group in Settings (or "auto" resolves to hidden — the selected OS doesn't recommend it) — everything's shown by default. */
function isSourceVisible(
  source: PackageSourceId,
  installGroups: InstallFormatGroup[],
  recommended: Set<string> | undefined,
): boolean {
  const group = ALL_SOURCE_GROUPS.find((g) => SOURCE_GROUP_MEMBERS[g]?.includes(source));
  if (!group) return true;
  const found = installGroups.find((g) => g.id === group);
  return found ? isGroupEffectivelyShown(found, recommended) : true;
}

/** Packages bucketed by platform/distro group (same grouping as the app-card dot-map), in `ALL_SOURCE_GROUPS`' fixed canonical order rather than array-arrival order. */
function groupPackagesBySourceGroup(packages: SourcedPackage[]): [string, SourcedPackage[]][] {
  const byGroup = new Map<string, SourcedPackage[]>();
  for (const pkg of packages) {
    const group = ALL_SOURCE_GROUPS.find((g) => SOURCE_GROUP_MEMBERS[g]?.includes(pkg.source));
    const key = group ?? "Other";
    const list = byGroup.get(key) ?? [];
    list.push(pkg);
    byGroup.set(key, list);
  }
  return [...ALL_SOURCE_GROUPS, "Other"]
    .filter((key) => byGroup.has(key))
    .map((key) => [key, byGroup.get(key) as SourcedPackage[]]);
}

/** One platform group's packages, bucketed by their exact packaging source (e.g. AUR vs Official within "Arch Linux") — packages sharing a source are different builds of the same product (see `SourceInstallUnit`), in first-seen order. */
function groupBySource(packages: SourcedPackage[]): [PackageSourceId, SourcedPackage[]][] {
  const bySource = new Map<PackageSourceId, SourcedPackage[]>();
  for (const pkg of packages) {
    const list = bySource.get(pkg.source) ?? [];
    list.push(pkg);
    bySource.set(pkg.source, list);
  }
  return [...bySource.entries()];
}

/**
 * A source's build tabs (see `buildLabel`: "Stable", "ESR · Bin",
 * "Nightly"), falling back to the raw package name when two packages
 * would otherwise render the same label — real bug, found live: Discord
 * and Discord Canary, both merged under one app and both on Snap's
 * stable risk, rendered as two identical "Stable" tabs.
 */
function tabLabel(pkg: SourcedPackage, packages: SourcedPackage[]): string {
  const label = buildLabel(pkg);
  const collides = packages.some((p) => p !== pkg && buildLabel(p) === label);
  return collides ? pkg.name : label;
}

/**
 * A small "or" between two install options — without it, a stack of
 * buttons reads as a checklist ("do all of these"), not a choice ("pick
 * whichever works for you"). Left-aligned, no border lines (unlike
 * Browse's own "Page N" divider) — the options themselves are narrow,
 * left-hugging buttons, not full-width rows, so a line stretching the
 * full row width would end up wider than anything it's dividing.
 */
const Or = component$(() => (
  <span class="text-xs text-base-content/70" aria-hidden="true">
    or
  </span>
));

/**
 * One packaging source's install info, e.g. "AUR" within "Arch Linux" —
 * two labeled sub-sections: "Prerequisites" (only when this source needs
 * a one-time remote/helper setup first and the user hasn't confirmed it
 * yet — persisted, so it only shows once per source) and "Install
 * options" (up to three independent actions: a deep-link button when
 * this source has a real one, the terminal command with its own copy
 * button, and a link to the source's own store/package page as a last
 * resort). When more than one package shares this source (AUR's
 * official/`-bin`/`-git` builds of the same app, merged into one app but
 * still genuinely different installs), a small tab group picks which
 * build's actions show — real bug, found live: these used to render as
 * separate flat rows differing only in a "(git build)" parenthetical,
 * easy to miss scanning a long list.
 */
const SourceInstallUnit = component$<{
  packages: SourcedPackage[];
  appHomepage: string | undefined;
  compatWarnings: CatalogApp["compatibilityWarnings"];
  /** Whether a sibling `SourceInstallUnit` shares this group — when it's the only one, the group heading above already names the source, so repeating it here would be pure redundancy. */
  showLabel: boolean;
}>(({ packages, appHomepage, compatWarnings, showLabel }) => {
  const selectedIndex = useSignal(0);
  const settings = useSettings();

  const snapAttemptFailed = useSignal(false);

  const pkg = packages[selectedIndex.value] ?? packages[0];
  if (!pkg) return null;

  const method = INSTALL_METHODS[pkg.source];
  const leafId = PACKAGE_SOURCE_TO_LEAF_ID[pkg.source];
  const sourceOption = leafId ? findSourceOption(settings.installGroups.value, leafId) : undefined;
  const command = installCommand(pkg);
  const osEntry = findOsEntry(settings.osId.value);
  const preActivated = osEntry ? new Set(osEntry.preActivatedRepoIds) : undefined;
  const needsSetup =
    method.setup && !(sourceOption && isRepoEffectivelyActivated(sourceOption, preActivated));
  const warning = compatWarnings?.find((w) => w.source === pkg.source);

  const deepLinkUrl = installDeepLink(pkg);
  const homepageLink = pkg.homepage ?? appHomepage;
  // The primary clickable action: a real deep link when this source has
  // one, otherwise (for "link"-kind sources only) the source's own
  // homepage/store page — GOG, Lutris, AppImage, GitHub Releases have no
  // deep-link scheme at all, so their homepage *is* the install action.
  const primaryLink = method.kind === "link" ? (deepLinkUrl ?? homepageLink) : deepLinkUrl;
  const websiteLink = installWebsiteLink(pkg);
  // Only worth its own row when it's not already what the button above points to.
  const showWebsiteFallback = websiteLink && websiteLink.url !== primaryLink;
  const primaryLabel = SOURCE_GROUP_MEMBERS.AppImage?.includes(pkg.source)
    ? "Download"
    : "Click to install";
  const installOptionCount = [primaryLink, command, showWebsiteFallback].filter(Boolean).length;
  // A lone option under a "Prerequisites" heading still needs its own
  // label to read as a separate step — only skip it when there's nothing
  // above it *and* nothing else below it to group together.
  const showInstallOptionsLabel = needsSetup || installOptionCount > 1;

  // Snap's own store (canonical/snapcraft.io's openDesktop.ts) doesn't use
  // a plain link for snap:// — there's no reliable way to detect a missing
  // handler from a click, so a bare link either silently works or silently
  // does nothing. They open it in a hidden iframe and use a blur/
  // visibilitychange listener with a timeout to infer success (the OS
  // switching away to launch the handler blurs the page) — ported here
  // rather than reinvented, same technique, same ~1.5s window.
  const tryDeepLink = $((url: string) => {
    snapAttemptFailed.value = false;

    document.querySelector(".js-snap-open-frame")?.remove();
    const iframe = document.createElement("iframe");
    iframe.className = "js-snap-open-frame";
    iframe.style.cssText = "position:absolute;top:-9999px;left:-9999px";
    iframe.src = url;
    document.body.appendChild(iframe);

    let settled = false;
    let timer = 0;
    const finish = (success: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (!success) snapAttemptFailed.value = true;
    };
    const onBlur = () => finish(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") finish(true);
    };
    timer = window.setTimeout(() => finish(false), 1500);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
  });

  const verified = isVerifiedPackage(pkg);
  const provenance = provenanceInfo(pkg.provenance);
  // Sources write their own version shape (Debian's `4:25.2.3-2+deb13u6`,
  // AUR's `157.0-1`); shown as-is, it's what the package manager reports.
  const version = pkg.version && pkg.version !== "unknown" ? pkg.version : undefined;

  return (
    <div class="flex flex-col gap-2">
      {(showLabel || verified || provenance || version) && (
        <div class="flex items-center gap-2">
          {showLabel && (
            <span class="text-sm font-medium">
              {SHORT_SOURCE_LABELS[pkg.source] ?? SOURCE_LABELS[pkg.source]}
            </span>
          )}
          {verified && (
            <a
              href="/docs/glossary/#verified"
              class="tooltip badge badge-success badge-outline badge-xs gap-1"
              data-tip="Developer-identity-verified on Flathub"
            >
              <LuBadgeCheck class="text-xs" />
              Verified
            </a>
          )}
          {provenance && (
            <a
              href="/docs/glossary/#provenance"
              class="tooltip badge badge-ghost badge-xs"
              data-tip={provenance.tip}
            >
              {provenance.label}
            </a>
          )}
          {version && (
            <span class="text-xs text-base-content/70 font-mono truncate">{version}</span>
          )}
        </div>
      )}

      {/* Classic underlined tabs, not the tabs-box pill group this had before
          — the build-selector state (`selectedIndex`) lives here, one
          level below the group's own `<summary>` in SourceGroupSection, so
          moving it up into the summary itself (replacing its "(N)" count)
          would need that state lifted a level up and shared across every
          source in the group, not just this one — a real restructure, not
          a style tweak, and still ambiguous for a group where more than one
          source has its own builds. Left as a classic tab row instead. */}
      {packages.length > 1 && (
        <div role="tablist" class="tabs tabs-border tabs-sm w-fit">
          {packages.map((p, i) => (
            <button
              key={`${p.source}:${p.name}`}
              type="button"
              role="tab"
              class={["tab", i === selectedIndex.value && "tab-active"]}
              onClick$={() => (selectedIndex.value = i)}
            >
              {tabLabel(p, packages)}
            </button>
          ))}
        </div>
      )}

      {warning && (
        <div
          class={[
            "text-xs rounded-field p-2 flex flex-col gap-1",
            warning.severity === "warning"
              ? "bg-warning/15 text-warning-content"
              : "bg-info/15 text-info-content",
          ]}
        >
          <p>{warning.issue}</p>
          {warning.fix && <code class="font-mono break-all">{warning.fix}</code>}
        </div>
      )}

      {/* (0) One-time setup/activation, before any install action — applies to link-kind sources (Flatpak's own remote) just as much as command-kind ones (the AUR helper, Universe, ...), so this no longer lives inside the command-only branch below. Label flush left, content indented under it (pl-3) — the label-to-content gap (gap-1) stays tighter than the gap to whatever's above/below it, so it reads as "this belongs together" rather than one more item in a flat list. */}
      {needsSetup && method.setup && (
        <div class="flex flex-col gap-1">
          <span class="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
            Prerequisites
          </span>
          <div class="bg-base-200 rounded-field p-2 flex flex-col gap-2 ml-3">
            <p class="text-xs text-base-content/70">{method.setup.note}</p>
            {method.setup.kind === "link" ? (
              <a
                href={method.setup.url}
                class="link link-primary text-xs"
                target="_blank"
                rel="noopener"
              >
                {method.setup.url}
              </a>
            ) : (
              <code class="text-xs font-mono break-all">{method.setup.command}</code>
            )}
            {leafId && (
              <button
                type="button"
                class="btn btn-xs btn-outline self-start"
                onClick$={() => setSourceActivated(settings.installGroups, leafId, "on")}
              >
                I've already done this
              </button>
            )}
          </div>
        </div>
      )}

      {(primaryLink || command || showWebsiteFallback) && (
        <div class={["flex flex-col gap-1", needsSetup && method.setup && "mt-2"]}>
          {showInstallOptionsLabel && (
            <span class="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
              Install options
            </span>
          )}

          <div class="flex flex-col gap-2 ml-3">
            {/* (1) A clickable install button — the deep link when this source has a real one, otherwise (link-kind sources only) the homepage itself. */}
            {primaryLink &&
              (method.deepLink?.needsIframeDetection && primaryLink === deepLinkUrl ? (
                <div class="flex flex-col gap-1">
                  <button
                    type="button"
                    class="btn btn-outline btn-sm w-fit"
                    onClick$={() => tryDeepLink(primaryLink)}
                  >
                    {primaryLabel}
                    <LuExternalLink class="text-xs" />
                  </button>
                  {snapAttemptFailed.value && (
                    <p class="text-xs text-warning">
                      Couldn't open the Snap Store app — make sure snapd is installed and running,
                      or use the command below instead.
                    </p>
                  )}
                </div>
              ) : (
                <a
                  href={primaryLink}
                  class="btn btn-outline btn-sm w-fit"
                  target="_blank"
                  rel="noopener"
                >
                  {primaryLabel}
                  <LuExternalLink class="text-xs" />
                </a>
              ))}
            {!primaryLink && method.kind === "link" && (
              <p class="text-sm text-base-content/70">No direct link available yet.</p>
            )}

            {/* (2) The terminal command, and its copy button, on one line — a shorter button label than before leaves more room for the command itself. */}
            {command && (
              <>
                {primaryLink && <Or />}
                <div class="flex items-center gap-2 bg-neutral text-neutral-content rounded-field px-3 py-2">
                  <code class="text-xs font-mono break-all flex-1">{command}</code>
                  <button
                    type="button"
                    class="btn btn-outline btn-sm w-fit shrink-0"
                    onClick$={() => navigator.clipboard.writeText(command)}
                  >
                    Copy Command
                  </button>
                </div>
              </>
            )}

            {/* (3) The store/homepage page, last — a catch-all for when nothing above worked or applied. */}
            {showWebsiteFallback && (
              <>
                {(primaryLink || command) && <Or />}
                <a
                  href={websiteLink.url}
                  class="btn btn-outline btn-sm w-fit"
                  target="_blank"
                  rel="noopener"
                >
                  {`View on ${websiteLink.label}`}
                  <LuExternalLink class="text-xs" />
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

/** One collapsible per platform/distro group, closed by default (a popular app can have a dozen-plus groups — open by default would be a wall of commands, not a scannable list) using daisyUI's `collapse` on a native `<details>` for real keyboard/accessibility support rather than a hand-rolled toggle. */
const SourceGroupSection = component$<{
  group: string;
  packages: SourcedPackage[];
  appHomepage: string | undefined;
  compatWarnings: CatalogApp["compatibilityWarnings"];
}>(({ group, packages, appHomepage, compatWarnings }) => {
  const bySource = groupBySource(packages);

  return (
    <details class="collapse collapse-arrow bg-base-100 border border-base-300">
      <summary class="collapse-title min-h-0 py-3 font-medium text-sm">
        {group}
        {packages.length > 1 && (
          <span class="text-base-content/70 font-normal"> ({packages.length})</span>
        )}
      </summary>
      <div class="collapse-content">
        <div class="flex flex-col gap-4">
          {bySource.map(([source, sourcePackages]) => (
            <SourceInstallUnit
              key={source}
              packages={sourcePackages}
              appHomepage={appHomepage}
              compatWarnings={compatWarnings}
              showLabel={bySource.length > 1}
            />
          ))}
        </div>
      </div>
    </details>
  );
});

const RELATION_LABELS: Record<`${Relation["type"]}:${Relation["direction"]}`, string> = {
  "forkOf:outgoing": "Fork of",
  "forkOf:incoming": "Forks",
  "replaces:outgoing": "Replaces",
  "replaces:incoming": "Replaced by",
  "wrapperOf:outgoing": "Unofficial client for",
  "wrapperOf:incoming": "Unofficial clients",
  "partOf:outgoing": "Part of",
  "partOf:incoming": "Components",
  "toolFor:outgoing": "Tool for",
  "toolFor:incoming": "Tools",
};

/** A product's relations grouped under one label each ("Fork of", "Forks", ...), in `RELATION_LABELS` order. */
function groupRelations(relations: Relation[]): [string, Relation["app"][]][] {
  const byLabel = new Map<string, Relation["app"][]>();
  for (const relation of relations) {
    const label = RELATION_LABELS[`${relation.type}:${relation.direction}`];
    byLabel.set(label, [...(byLabel.get(label) ?? []), relation.app]);
  }
  return Object.values(RELATION_LABELS)
    .filter((label) => byLabel.has(label))
    .map((label) => [label, byLabel.get(label) ?? []]);
}

const COMPANION_KIND_LABELS: Record<CompanionKind, string> = {
  component: "Components",
  extension: "Extensions",
  plugin: "Plugins",
  theme: "Themes",
  localization: "Language packs",
  data: "Data packs",
  "native-host": "Native messaging hosts",
  config: "Configuration",
};

/** A product's companions grouped by kind, in `COMPANION_KIND_LABELS` order. */
function groupCompanions(companions: Companion[]): [CompanionKind, Companion[]][] {
  return (Object.keys(COMPANION_KIND_LABELS) as CompanionKind[])
    .map((kind): [CompanionKind, Companion[]] => [
      kind,
      companions.filter((companion) => companion.kind === kind),
    ])
    .filter(([, list]) => list.length > 0);
}

/** `SourceStack`/`BuildIndicator`'s combined props, derived from a full package list — used for the hero/sticky-header install summary, sitting to the left of the Install button (replaces the old "Install options (N)" count that used to live on the button itself). */
function summarizeSources(packages: SourcedPackage[]) {
  return {
    sources: unique(packages.map((pkg) => pkg.source)),
    lines: summarizeReleaseLines(packages),
    verifiedSources: verifiedSourcesOf(packages),
  };
}

export default component$(() => {
  const location = useLocation();
  const relatedApps = useRelatedApps();
  const catalogUnavailable = useCatalogUnavailable().value;
  const app = useApp();
  const buildSelection = useBuildSelection();
  const stats = useDetailStats();
  const settings = useSettings();
  const a = app.value;

  const jumboRef = useSignal<HTMLElement>();
  const showStickyBar = useSignal(false);
  const drawerOpen = useSignal(false);

  useVisibleTask$(({ cleanup }) => {
    const el = jumboRef.value;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => (showStickyBar.value = !entry.isIntersecting),
      {
        rootMargin: "-64px 0px 0px 0px",
      },
    );
    observer.observe(el);
    cleanup(() => observer.disconnect());
  });

  if (!a) {
    return (
      <div class="text-center py-24">
        <h1 class="text-2xl font-bold mb-2">
          {catalogUnavailable ? "This app can't be loaded right now" : "App not found"}
        </h1>
        <p class="text-base-content/70 mb-4">
          {catalogUnavailable
            ? "The catalog is temporarily unavailable — please try again in a few minutes."
            : "No app has this address. It may have been renamed or merged into another one."}
        </p>
        <a href="/" class="link link-primary">
          Back to search
        </a>
      </div>
    );
  }

  // From the full package list, not the OS-filtered one below — a
  // developer-verified listing doesn't stop being verified just because
  // its source is hidden by the selected OS.
  const hasVerifiedPackage = a.packages.some(isVerifiedPackage);

  // The catalog also carries metadata-only sources (the `*-appstream` feeds)
  // that exist to enrich the app's name/categories, not to be installed from —
  // they have no `INSTALL_METHODS` entry, and rendering one in the drawer
  // throws, which silently wedges every later re-render (so it never closes).
  // The edition/version combination this page shows (its path, see
  // `useBuildSelection`). Install options and version-specific facts
  // (rating, size, changelog) are that combination's own; descriptive
  // content (description, screenshots, developer, ...) stays the
  // product's. The default combination keeps the product-level facts it
  // always showed.
  const selection = buildSelection.value;
  const isDefaultBuild = !selection.track && !selection.risk;
  const selectedPackages = packagesOf(a.packages, selection);
  // Release date and install counts belong to the default build (they
  // come from its AppStream metadata and Flathub listing): shown for that
  // combination only, never borrowed by an edition or version they don't
  // describe.
  const facts = isDefaultBuild
    ? {
        rating: a.rating,
        approxSizeBytes: a.approxSizeBytes,
        changelog: a.changelog,
        lastUpdated: a.lastUpdated,
        installsTotal: a.installsTotal,
        installsLast7Days: a.installsLast7Days,
      }
    : {
        ...buildFacts(selectedPackages),
        lastUpdated: undefined,
        installsTotal: undefined,
        installsLast7Days: undefined,
      };
  const relationGroups = groupRelations(a.relations ?? []);
  const relatedById = new Map(relatedApps.value.related.map((card) => [card.id, card]));
  const confidence = confidenceNotes(a.dataConfidence);
  const picks = storePicks(a.storeCollections);
  // "Available via", one entry per platform ("AUR (14)" for 14 builds),
  // the full list of packagings one click away.
  const installSourcePackages = a.packages.filter((pkg) => isInstallSource(pkg.source));
  const availableViaAll = availableViaLabels(installSourcePackages);
  const availableVia = groupPackagesBySourceGroup(installSourcePackages).map(
    ([group, packages]) => {
      const builds = availableViaLabels(packages).length;
      return { label: builds > 1 ? `${group} (${builds})` : group };
    },
  );
  const licenseKind = classifyLicense(a.license);
  const licenseHref = licenseInfoHref(a.license);
  // The badge names the license when it's one short id ("MPL-2.0"), not a
  // long expression — the tooltip and the info row carry the full string.
  const licenseShortName =
    a.license && a.license.length <= 24 && !/\s/.test(a.license) ? a.license : undefined;
  const installsTip =
    facts.installsTotal === undefined
      ? ""
      : `${facts.installsTotal.toLocaleString("en")} installs on Flathub` +
        (facts.installsLast7Days === undefined
          ? ""
          : ` · ${facts.installsLast7Days.toLocaleString("en")} in the last 7 days`);
  const latestRelease = releaseAge(facts.lastUpdated, new Date());
  const ratingPackages = isDefaultBuild ? a.packages : selectedPackages;
  const editions = editionsOf(a.packages);
  const versions = versionsByEdition(a.packages);

  const installablePackages = selectedPackages.filter((pkg) => pkg.source in INSTALL_METHODS);

  const selectedOs = findOsEntry(settings.osId.value);
  const recommended = selectedOs ? recommendedGroupIds(selectedOs) : undefined;
  const visiblePackages = installablePackages.filter((pkg) =>
    isSourceVisible(pkg.source, settings.installGroups.value, recommended),
  );
  // Non-empty only once an OS is selected and it doesn't recommend every
  // group — with no OS selected, "auto" shows everything (see
  // isGroupEffectivelyShown), so nothing's ever hidden here by default.
  const hiddenGroups = groupPackagesBySourceGroup(
    installablePackages.filter(
      (pkg) => !isSourceVisible(pkg.source, settings.installGroups.value, recommended),
    ),
  );
  const sourceSummary = summarizeSources(visiblePackages);
  // Platforms that only have other editions/versions of this product
  // (Debian ships Firefox ESR, not Firefox) — linked from the drawer so
  // landing on the default page never reads as "not on Debian".
  const elsewhere = groupPackagesBySourceGroup(
    a.packages.filter(
      (pkg) =>
        pkg.source in INSTALL_METHODS &&
        !installablePackages.some((selected) => selected.source === pkg.source),
    ),
  ).map(([group, packages]): [string, BuildSelection[]] => [
    group,
    otherSelections(packages, selection),
  ]);

  return (
    <div class="flex flex-col gap-10">
      {showStickyBar.value && (
        <div class="fixed! top-16 inset-x-0 z-30 glass-card rounded-none!">
          <div class="max-w-6xl mx-auto px-4 md:px-6 py-2 flex items-center gap-3">
            <div class="w-8 h-8 rounded-field bg-base-300 flex items-center justify-center overflow-hidden shrink-0">
              {a.iconUrl ? (
                <img
                  src={a.iconUrl}
                  alt=""
                  width={32}
                  height={32}
                  class="w-full h-full object-cover"
                />
              ) : (
                <LuPackage class="text-base text-base-content/70" />
              )}
            </div>
            <span class="font-medium truncate">{a.name}</span>
            <BuildSelectors
              appId={a.id}
              selection={selection}
              editions={editions}
              versionsByEdition={versions}
              size="sm"
            />
            <div class="flex-1" />
            {/* Hidden on phones: with the pickers it pushed the Install
                button out of the sticky bar. The page header still has it. */}
            {visiblePackages.length > 0 && (
              <div class="hidden sm:flex items-center gap-2 mr-3">
                <SourceStack
                  sources={sourceSummary.sources}
                  verifiedSources={sourceSummary.verifiedSources}
                  placement="bottom"
                  focusable
                />
                <BuildIndicator lines={sourceSummary.lines} placement="bottom" focusable />
              </div>
            )}
            <div class="aura aura-sm w-fit">
              <button
                type="button"
                class="btn btn-primary btn-sm min-w-[120px]"
                onClick$={() => (drawerOpen.value = true)}
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      <section
        ref={jumboRef}
        class="relative flex flex-col md:flex-row gap-6 md:items-start rounded-box"
      >
        {/* Clipped on its own wrapper, not on the section: an overflow on
            the section cut off the Edition/Version menus where they hang
            below its bottom edge. */}
        {a.videos?.[0] && (
          <div class="absolute inset-0 -z-10 overflow-hidden rounded-box pointer-events-none">
            <video
              class="w-full h-full object-cover opacity-15"
              src={a.videos[0]}
              autoplay
              muted
              loop
              playsInline
            />
          </div>
        )}

        <div class="w-20 h-20 rounded-box bg-base-200 flex items-center justify-center shrink-0 overflow-hidden">
          {a.iconUrl ? (
            <img src={a.iconUrl} alt="" width={80} height={80} class="w-full h-full object-cover" />
          ) : (
            <LuPackage class="text-4xl text-base-content/70" />
          )}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 class="text-3xl font-bold">{a.name}</h1>
            <BuildSelectors
              appId={a.id}
              selection={selection}
              editions={editions}
              versionsByEdition={versions}
              size="lg"
            />
          </div>
          <p class="text-base-content/70 mt-1">{a.shortDescription}</p>
          {a.developer && (
            <p class="text-sm text-base-content/70 mt-1 flex items-center gap-1.5">
              by{" "}
              {a.homepage ? (
                <a href={a.homepage} class="link link-hover" target="_blank" rel="noopener">
                  {a.developer}
                </a>
              ) : (
                a.developer
              )}
              {hasVerifiedPackage && (
                <span
                  class="tooltip inline-flex items-center gap-1 text-success"
                  data-tip="This listing's Flathub package is from a developer-identity-verified publisher"
                >
                  <LuBadgeCheck class="text-sm" />
                  <span class="text-xs">Verified</span>
                </span>
              )}
            </p>
          )}

          {/* Two lines: what the app is (type, category, license, suite,
              age rating...), then how it's doing (rating, installs,
              activity) — each figure detailed in its tooltip. */}
          <div class="flex flex-wrap items-center gap-2 mt-3">
            {a.contentType === "game" && <span class="badge badge-accent">Game</span>}
            {a.category && <span class="badge badge-outline">{a.category}</span>}
            {licenseKind !== "unknown" &&
              (licenseHref ? (
                <a
                  href={licenseHref}
                  target={licenseHref.startsWith("/") ? undefined : "_blank"}
                  rel={licenseHref.startsWith("/") ? undefined : "noopener"}
                  class={[
                    "tooltip badge badge-outline gap-1",
                    licenseKind === "free" && "badge-success",
                  ]}
                  data-tip={`License: ${a.license} — what it lets you do`}
                >
                  {licenseKind === "free" ? "Free software" : "Proprietary"}
                  {licenseKind === "free" && licenseShortName && <span>· {licenseShortName}</span>}
                </a>
              ) : (
                <span
                  class={["badge badge-outline gap-1", licenseKind === "free" && "badge-success"]}
                  title={`License: ${a.license}`}
                >
                  {licenseKind === "free" ? "Free software" : "Proprietary"}
                </span>
              ))}
            {picks.map((pick) => (
              <span key={pick} class="badge badge-ghost">
                {pick}
              </span>
            ))}
            {a.suite?.role === "component" && a.suite.mainApp && (
              <a
                href={`/app/${encodeURIComponent(a.suite.mainApp.id)}/`}
                class="badge badge-outline hover:badge-primary"
              >
                Part of {a.suite.mainApp.name}
              </a>
            )}
            {a.ageRating && (
              <span class="badge badge-outline">
                {a.ageRating.system} {a.ageRating.value}
              </span>
            )}
            {a.aiFeatures && <span class="badge badge-secondary">AI features</span>}
            {a.inAppPurchases && <span class="badge badge-warning">In-app purchases</span>}
          </div>

          {(facts.rating || facts.installsTotal !== undefined || latestRelease) && (
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-base-content/70">
              {facts.rating && (
                <UnifiedRating
                  average={facts.rating.average}
                  count={facts.rating.count}
                  bySource={summarizeRatingsBySource(ratingPackages)}
                  focusable
                />
              )}
              {facts.installsTotal !== undefined && (
                <span
                  class="tooltip inline-flex items-center gap-1"
                  data-tip={installsTip}
                  title={installsTip}
                >
                  <LuDownload class="text-sm" />
                  {compactCount(facts.installsTotal)} installs
                </span>
              )}
              {facts.lastUpdated && latestRelease && (
                <span
                  class="tooltip inline-flex items-center gap-1"
                  data-tip={`Latest release: ${formatReleaseDate(facts.lastUpdated)}`}
                  title={`Latest release: ${formatReleaseDate(facts.lastUpdated)}`}
                >
                  <LuHistory class="text-sm" />
                  Updated {latestRelease}
                </span>
              )}
            </div>
          )}
        </div>

        <div class="flex flex-col items-start md:items-end gap-2">
          <div class="flex flex-wrap items-center gap-3">
            {visiblePackages.length ? (
              <>
                <div class="flex items-center gap-2 mr-3">
                  <SourceStack
                    sources={sourceSummary.sources}
                    verifiedSources={sourceSummary.verifiedSources}
                    placement="bottom"
                    focusable
                  />
                  <BuildIndicator lines={sourceSummary.lines} placement="bottom" focusable />
                </div>
                <div class="aura aura-sm w-fit">
                  <button
                    type="button"
                    class="btn btn-primary btn-sm min-w-[120px]"
                    onClick$={() => (drawerOpen.value = true)}
                  >
                    Install
                  </button>
                </div>
              </>
            ) : hiddenGroups.length > 0 || elsewhere.length > 0 ? (
              // Every source is hidden by the selected OS's recommendations,
              // but some exist — open the drawer to its collapsed "other
              // platforms" section instead of claiming there's nothing.
              <button
                type="button"
                class="btn btn-outline btn-sm min-w-[120px]"
                onClick$={() => (drawerOpen.value = true)}
              >
                Install
              </button>
            ) : (
              <span class="btn btn-disabled btn-sm" aria-disabled="true">
                No install source available
              </span>
            )}
          </div>
          {/* Starter version of the claim flow — a button and a static
            explainer page, not the mechanism itself (that needs user
            accounts, an ownership-verification process, and a real
            per-field edit capability, none of which exist yet — see
            /claim/). Only here, under the hero's Install button — not
            duplicated on the fixed sticky-header variant that appears on
            scroll. */}
          <div class="flex flex-col items-start md:items-end">
            <a
              href={`/claim/?app=${encodeURIComponent(a.id)}`}
              class="btn btn-ghost btn-sm gap-1.5"
            >
              <LuBadgeCheck class="text-base" />
              Claim this listing
            </a>
            <a
              href={reportDataProblemUrl({ name: a.name, pageUrl: location.url.href })}
              class="btn btn-ghost btn-sm gap-1.5"
              target="_blank"
              rel="noopener"
            >
              <LuFlag class="text-base" />
              Report this app
            </a>
          </div>
        </div>
      </section>

      {/* Suite main app: link out to each separately-installable component. */}
      {a.suite?.role === "main" && a.suite.components && a.suite.components.length > 0 && (
        <section>
          <h2 class="text-lg font-semibold mb-1">Suite components</h2>
          <p class="text-sm text-base-content/70 mb-3">
            {a.name} bundles these into one install where a source offers it — each is also
            separately installable on its own.
          </p>
          <div class="flex flex-wrap gap-2">
            {a.suite.components.map((component) => (
              <a
                key={component.id}
                href={`/app/${encodeURIComponent(component.id)}/`}
                class="btn btn-outline btn-sm"
              >
                {component.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Exhaustive mode: every install method, right-side drawer, sorted by settings preference. */}
      {drawerOpen.value && (
        <div class="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            class="absolute inset-0 bg-black/40"
            aria-label="Close install options"
            onClick$={() => (drawerOpen.value = false)}
          />
          <div class="relative w-full max-w-sm sm:max-w-md lg:max-w-xl bg-base-100 h-full shadow-xl p-5 flex flex-col gap-3 overflow-y-auto">
            <div class="flex items-center justify-between mb-1">
              <h2 class="text-lg font-semibold">Install options</h2>
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-square"
                aria-label="Close install options"
                onClick$={() => (drawerOpen.value = false)}
              >
                ✕
              </button>
            </div>
            <p class="text-sm text-base-content/70 -mt-2">
              Not sure which to pick?{" "}
              <a href="/docs/formats/" class="link link-primary">
                Which format to choose
              </a>
            </p>
            {groupPackagesBySourceGroup(visiblePackages).map(([group, packages]) => (
              <SourceGroupSection
                key={group}
                group={group}
                packages={packages}
                appHomepage={a.homepage}
                compatWarnings={a.compatibilityWarnings}
              />
            ))}

            {hiddenGroups.length > 0 && (
              <details class="collapse collapse-arrow bg-base-100 border border-dashed border-base-300">
                <summary class="collapse-title min-h-0 py-3 text-sm text-base-content/70">
                  Show{" "}
                  {hiddenGroups.length === 1
                    ? "1 other platform"
                    : `${hiddenGroups.length} other platforms`}
                </summary>
                <div class="collapse-content flex flex-col gap-3">
                  {hiddenGroups.map(([group, packages]) => (
                    <SourceGroupSection
                      key={group}
                      group={group}
                      packages={packages}
                      appHomepage={a.homepage}
                      compatWarnings={a.compatibilityWarnings}
                    />
                  ))}
                </div>
              </details>
            )}

            {elsewhere.length > 0 && (
              <div class="flex flex-col gap-1.5 text-sm">
                <p class="text-base-content/70">In other editions or versions of {a.name}:</p>
                {elsewhere.map(([group, selections]) => (
                  <p key={group} class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span class="font-medium">{group}</span>
                    {selections.map((other) => (
                      <a
                        key={buildPath(a.id, other)}
                        href={buildPath(a.id, other)}
                        class="link link-primary"
                      >
                        {selectionLabel(other)}
                      </a>
                    ))}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {a.screenshots?.length || a.videos?.length ? (
        <section>
          <h2 class="text-lg font-semibold mb-3">Screenshots & videos</h2>
          <div class="flex gap-3 overflow-x-auto p-1">
            {a.screenshots?.length ? (
              <ScreenshotGallery screenshots={a.screenshots} appName={a.name} />
            ) : null}
            {a.videos?.map((src) => (
              <video key={src} src={src} controls class="h-48 rounded-box shrink-0">
                <track kind="captions" label="No captions available" />
              </video>
            ))}
          </div>
        </section>
      ) : null}

      {a.longDescription ? (
        <section>
          <h2 class="text-lg font-semibold mb-2">About</h2>
          <p class="whitespace-pre-line text-base-content/80">{a.longDescription}</p>
        </section>
      ) : null}

      {a.features?.length ? (
        <section>
          <h2 class="text-lg font-semibold mb-2">Features</h2>
          <ul class="list-disc list-inside text-base-content/80">
            {a.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {facts.changelog ? (
        <section>
          <h2 class="text-lg font-semibold mb-2">Changelog</h2>
          <p class="whitespace-pre-line text-base-content/80">{facts.changelog}</p>
        </section>
      ) : null}

      {a.requirements ? (
        <section>
          <h2 class="text-lg font-semibold mb-2">Required configuration</h2>
          <p class="text-base-content/80">{a.requirements}</p>
        </section>
      ) : null}

      {a.reviews?.length ? (
        <section>
          <h2 class="text-lg font-semibold mb-2">Reviews</h2>
          <ul class="flex flex-col gap-3">
            {a.reviews.map((review) => (
              <li key={review.author} class="border border-base-300 rounded-box p-3">
                <div class="text-sm font-medium">
                  {review.author} — ★ {review.rating}
                </div>
                <p class="text-sm text-base-content/70 mt-1">{review.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Three cards by theme — the project, getting it, and the data
          itself — instead of one long two-column table. Each row only
          shows when its data exists. */}
      <section>
        <h2 class="text-lg font-semibold mb-3">Additional information</h2>
        <div class="grid gap-4 md:grid-cols-3 items-start">
          <div class={INFO_CARD}>
            <h3 class={INFO_CARD_TITLE}>Project</h3>
            <dl class={INFO_LIST}>
              {a.developer && (
                <div>
                  <dt class={INFO_LABEL}>Developer</dt>
                  <dd>{a.developer}</dd>
                </div>
              )}
              {a.publisher && a.publisher !== a.developer && (
                <div>
                  <dt class={INFO_LABEL}>Publisher</dt>
                  <dd>{a.publisher}</dd>
                </div>
              )}
              {a.license && (
                <div>
                  <dt class={INFO_LABEL}>License</dt>
                  <dd class="break-words">
                    {a.license}
                    {licenseKind !== "unknown" && (
                      <span class="text-base-content/70">
                        {" "}
                        ({licenseKind === "free" ? "free software" : "proprietary"})
                      </span>
                    )}
                    {licenseHref && (
                      <a
                        href={licenseHref}
                        target={licenseHref.startsWith("/") ? undefined : "_blank"}
                        rel={licenseHref.startsWith("/") ? undefined : "noopener"}
                        class="link link-primary block text-xs mt-0.5"
                      >
                        What this license lets you do
                      </a>
                    )}
                  </dd>
                </div>
              )}
              {a.homepage && (
                <div>
                  <dt class={INFO_LABEL}>Homepage</dt>
                  <dd class="break-all">
                    <a href={a.homepage} class="link link-primary" target="_blank" rel="noopener">
                      {a.homepage.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  </dd>
                </div>
              )}
              {facts.lastUpdated && latestRelease && (
                <div>
                  <dt class={INFO_LABEL}>Latest release</dt>
                  <dd>
                    {formatReleaseDate(facts.lastUpdated)}{" "}
                    <span class="text-base-content/70">({latestRelease})</span>
                  </dd>
                </div>
              )}
              {a.languages?.length && (
                <div>
                  <dt class={INFO_LABEL}>Languages</dt>
                  <dd>
                    {a.languages.length > 8
                      ? `${a.languages.length} languages`
                      : a.languages.join(", ")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div class={INFO_CARD}>
            <h3 class={INFO_CARD_TITLE}>Install</h3>
            <dl class={INFO_LIST}>
              {facts.approxSizeBytes && (
                <div>
                  <dt class={INFO_LABEL}>Size</dt>
                  <dd>{formatBytes(facts.approxSizeBytes)}</dd>
                </div>
              )}
              {facts.installsTotal !== undefined && (
                <div>
                  <dt class={INFO_LABEL}>Installs</dt>
                  <dd>
                    {facts.installsTotal.toLocaleString("en")} on Flathub
                    {facts.installsLast7Days !== undefined && (
                      <span class="block text-base-content/70">
                        {facts.installsLast7Days.toLocaleString("en")} in the last 7 days
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {availableVia.length > 0 && (
                <div>
                  <dt class={INFO_LABEL}>Available via</dt>
                  <dd>
                    {availableVia.map((entry) => entry.label).join(" · ")}
                    {availableViaAll.length > availableVia.length && (
                      <details class="mt-1">
                        <summary class="link link-primary text-xs cursor-pointer w-fit">
                          All {availableViaAll.length} packagings
                        </summary>
                        <p class="text-xs text-base-content/70 mt-1">
                          {availableViaAll.join(", ")}
                        </p>
                      </details>
                    )}
                  </dd>
                </div>
              )}
              {a.permissions?.length && (
                <div>
                  <dt class={INFO_LABEL}>Permissions</dt>
                  <dd>{a.permissions.join(", ")}</dd>
                </div>
              )}
            </dl>
          </div>

          <div class={INFO_CARD}>
            <h3 class={INFO_CARD_TITLE}>About this data</h3>
            <dl class={INFO_LIST}>
              {confidence.length > 0 && (
                <div>
                  <dt class={INFO_LABEL}>Sources</dt>
                  <dd class="flex flex-col gap-0.5">
                    {confidence.map((note) => (
                      <span
                        key={note.text}
                        title={note.title}
                        class="inline-flex items-start gap-1.5"
                      >
                        {note.tone === "good" ? (
                          <LuCheck class="text-success shrink-0 mt-0.5" />
                        ) : (
                          <LuAlertTriangle class="text-warning shrink-0 mt-0.5" />
                        )}
                        {note.text}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {stats.value.generatedAt && (
                <div>
                  <dt class={INFO_LABEL}>Catalog data as of</dt>
                  <dd>{formatReleaseDate(stats.value.generatedAt)}</dd>
                </div>
              )}
            </dl>
            <div class="flex flex-col items-start mt-3 -ml-3">
              <a
                // A data problem: catalog's form, with this page's link filled in.
                href={reportDataProblemUrl({ name: a.name, pageUrl: location.url.href })}
                class="btn btn-ghost btn-sm gap-1.5"
                target="_blank"
                rel="noopener"
              >
                <LuFlag class="text-base" />
                Report this app
              </a>
              <a
                href={`/claim/?app=${encodeURIComponent(a.id)}`}
                class="btn btn-ghost btn-sm gap-1.5"
              >
                <LuBadgeCheck class="text-base" />
                Claim this listing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What each source says, side by side — where the merged card's
          name, version or license came from, and where sources differ. */}
      {installSourcePackages.length > 1 && (
        <section>
          <details class="collapse collapse-arrow bg-base-100/70 border border-base-300">
            <summary class="collapse-title font-medium">
              How each source lists it ({installSourcePackages.length})
            </summary>
            <div class="collapse-content overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Name</th>
                    <th>Version</th>
                    <th>Built by</th>
                    <th>License</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {installSourcePackages.map((pkg) => (
                    <tr key={`${pkg.source}:${pkg.name}`} class="align-top">
                      <td class="whitespace-nowrap">{formatSourceLabel(pkg)}</td>
                      <td class="font-mono text-xs break-all">{pkg.name}</td>
                      <td class="font-mono text-xs break-all">
                        {pkg.version && pkg.version !== "unknown" ? pkg.version : "—"}
                      </td>
                      <td class="whitespace-nowrap">
                        {provenanceInfo(pkg.provenance)?.label ?? "—"}
                      </td>
                      <td class="text-xs min-w-24 break-words">{pkg.license ?? "—"}</td>
                      <td class="text-xs min-w-60">{pkg.description ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
      )}

      {/* Forks, successors, unofficial clients, ... — catalog's
          product-families relations — then apps of the same category, each
          as a row of cards like the homepage's. A related app missing from
          the published dataset still gets a plain link. */}
      {(relationGroups.length > 0 || relatedApps.value.similar.length > 0) && (
        <section class="flex flex-col gap-6">
          <h2 class="text-lg font-semibold">Related</h2>
          {relationGroups.map(([label, apps]) => {
            const cards = apps
              .map((related) => relatedById.get(related.id))
              .filter((card): card is AppSummary => card !== undefined);
            const missing = apps.filter((related) => !relatedById.has(related.id));
            return (
              <div key={label}>
                <h3 class="text-sm font-semibold text-base-content/70 mb-2">{label}</h3>
                {cards.length > 0 && (
                  <HorizontalScroller ariaLabel={`${label} ${a.name}`}>
                    {cards.map((card) => (
                      <AppCardLink
                        key={card.id}
                        app={card}
                        linkClass="block w-64 shrink-0 snap-start"
                      />
                    ))}
                  </HorizontalScroller>
                )}
                {missing.length > 0 && (
                  <div class="flex flex-wrap gap-2">
                    {missing.map((related) => (
                      <a
                        key={related.id}
                        href={`/app/${encodeURIComponent(related.id)}/`}
                        class="btn btn-outline btn-sm"
                      >
                        {related.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {relatedApps.value.similar.length > 0 && (
            <div>
              <div class="flex items-baseline justify-between mb-2">
                <h3 class="text-sm font-semibold text-base-content/70">{a.category}</h3>
                <a
                  href={`/browse/?category=${encodeURIComponent(a.category)}`}
                  class="link link-primary text-sm"
                >
                  Browse all →
                </a>
              </div>
              <HorizontalScroller ariaLabel={`More in ${a.category}`}>
                {relatedApps.value.similar.map((card) => (
                  <AppCardLink
                    key={card.id}
                    app={card}
                    linkClass="block w-64 shrink-0 snap-start"
                  />
                ))}
              </HorizontalScroller>
            </div>
          )}
        </section>
      )}

      {/* Extensions, plugins, themes, language packs, ... — never cards of their own. */}
      {a.companions && a.companions.length > 0 && (
        <section>
          <h2 class="text-lg font-semibold mb-3">Add-ons</h2>
          <div class="flex flex-col gap-2">
            {groupCompanions(a.companions).map(([kind, companions]) => {
              const total = a.companionCounts?.[kind] ?? companions.length;
              return (
                <details key={kind} class="collapse collapse-arrow bg-base-200">
                  <summary class="collapse-title text-sm font-medium">
                    {COMPANION_KIND_LABELS[kind]} ({total})
                  </summary>
                  <div class="collapse-content">
                    {total > companions.length && (
                      <p class="text-xs text-base-content/70 mb-2">
                        The {companions.length} most widely packaged of {total}.
                      </p>
                    )}
                    <ul class="flex flex-col gap-1 text-sm">
                      {companions.map((companion) => (
                        <li key={companion.name}>
                          <span class="font-medium">{companion.name}</span>
                          {companion.description && (
                            <span class="text-base-content/70"> — {companion.description}</span>
                          )}
                          <span class="text-xs text-base-content/70">
                            {" "}
                            (
                            {unique(
                              companion.packages
                                .filter((pkg) => isInstallSource(pkg.source))
                                .map((pkg) => SOURCE_LABELS[pkg.source]),
                            ).join(", ")}
                            )
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const app = resolveValue(useApp);
  const unavailable = resolveValue(useCatalogUnavailable);
  return {
    title: app
      ? `${app.name} — Tuxery`
      : unavailable
        ? "Temporarily unavailable — Tuxery"
        : "App not found — Tuxery",
    meta: app ? [{ name: "description", content: app.shortDescription }] : [],
  };
};

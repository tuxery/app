import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuExternalLink, LuFlag, LuPackage } from "@qwikest/icons/lucide";
import { getAppById, getStats } from "~/catalog";
import {
  ALL_SOURCE_GROUPS,
  channelLabel,
  formatBytes,
  formatSourceLabel,
  SOURCE_GROUP_MEMBERS,
  SOURCE_LABELS,
  summarizeChannels,
  summarizeRatingsBySource,
  type CatalogApp,
  type PackageSourceId,
  type SourcedPackage,
} from "~/catalog-types";
import { SourceSummary } from "~/components/source-summary/source-summary";
import { UnifiedRating } from "~/components/unified-rating/unified-rating";
import {
  INSTALL_METHODS,
  installCommand,
  installDeepLink,
  installWebsiteLink,
} from "~/install-methods";
import {
  setSourceActivated,
  useSettings,
  type InstallFormatGroup,
  type SpecialRepoOption,
} from "~/settings";

export const useApp = routeLoader$(async (requestEvent): Promise<CatalogApp | null> => {
  const id = decodeURIComponent(requestEvent.params.id ?? "");
  const app = await getAppById(id);
  if (!app) requestEvent.status(404);
  return app;
});

export const useDetailStats = routeLoader$(async () => getStats());

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

/** True unless the user hid this source's platform/distro group in Settings — everything's shown by default. */
function isSourceVisible(source: PackageSourceId, installGroups: InstallFormatGroup[]): boolean {
  const group = ALL_SOURCE_GROUPS.find((g) => SOURCE_GROUP_MEMBERS[g]?.includes(source));
  if (!group) return true;
  return installGroups.find((g) => g.id === group)?.shown ?? true;
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

/** One platform group's packages, bucketed by their exact packaging source (e.g. AUR vs Official within "Arch Linux") — packages sharing a source are channel variants of the same build (see `SourceInstallUnit`), in first-seen order. */
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
 * A source's channel tabs, falling back to the raw package name when two
 * packages would otherwise render the same label — real bug, found live:
 * Snap's `channel` field is a release track (stable/candidate/beta/edge),
 * not a build variant, so Discord and Discord Canary (both merged under
 * one app, both on Snap's "stable" track) rendered as two identical
 * "Stable" tabs with no way to tell them apart.
 */
function tabLabel(pkg: SourcedPackage, packages: SourcedPackage[]): string {
  const label = channelLabel(pkg.channel);
  const collides = packages.some((p) => p !== pkg && channelLabel(p.channel) === label);
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
  <span class="text-xs text-base-content/40" aria-hidden="true">
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
 * channel's actions show — real bug, found live: these used to render as
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
  const needsSetup = method.setup && !sourceOption?.activated;
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

  return (
    <div class="flex flex-col gap-2">
      {showLabel && (
        <span class="text-sm font-medium">
          {SHORT_SOURCE_LABELS[pkg.source] ?? SOURCE_LABELS[pkg.source]}
        </span>
      )}

      {/* Classic underlined tabs, not the tabs-box pill group this had before
          — the channel-selector state (`selectedIndex`) lives here, one
          level below the group's own `<summary>` in SourceGroupSection, so
          moving it up into the summary itself (replacing its "(N)" count)
          would need that state lifted a level up and shared across every
          source in the group, not just this one — a real restructure, not
          a style tweak, and still ambiguous for a group where more than one
          source has its own channels. Left as a classic tab row instead. */}
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
          <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
            Prerequisites
          </span>
          <div class="bg-base-200 rounded-field p-2 flex flex-col gap-2 ml-3">
            <p class="text-xs text-base-content/60">{method.setup.note}</p>
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
                onClick$={() => setSourceActivated(settings.installGroups, leafId, true)}
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
            <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
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
              <p class="text-sm text-base-content/60">No direct link available yet.</p>
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
          <span class="text-base-content/50 font-normal"> ({packages.length})</span>
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

/** `SourceSummary`'s three props, derived from a full package list — used for the hero/sticky-header install summary, sitting to the left of the Install button (replaces the old "Install options (N)" count that used to live on the button itself). */
function summarizeSources(packages: SourcedPackage[]) {
  return {
    sources: [...new Set(packages.map((pkg) => pkg.source))],
    packageCount: packages.length,
    channels: summarizeChannels(packages),
  };
}

export default component$(() => {
  const app = useApp();
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
        <h1 class="text-2xl font-bold mb-2">App not found</h1>
        <p class="text-base-content/60 mb-4">
          It may not be in the loaded dataset — run <code class="font-mono">pnpm seed</code> then{" "}
          <code class="font-mono">pnpm serve</code> in <code class="font-mono">tuxery/catalog</code>{" "}
          for a local one.
        </p>
        <a href="/" class="link link-primary">
          Back to search
        </a>
      </div>
    );
  }

  const visiblePackages = a.packages.filter((pkg) =>
    isSourceVisible(pkg.source, settings.installGroups.value),
  );

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
                <LuPackage class="text-base text-base-content/40" />
              )}
            </div>
            <span class="font-medium truncate flex-1">{a.name}</span>
            {visiblePackages.length > 0 && (
              <SourceSummary {...summarizeSources(visiblePackages)} tooltipPosition="bottom" />
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
        class="relative flex flex-col md:flex-row gap-6 md:items-start overflow-hidden rounded-box"
      >
        {a.videos?.[0] && (
          <video
            class="absolute inset-0 w-full h-full object-cover opacity-15 -z-10 pointer-events-none"
            src={a.videos[0]}
            autoplay
            muted
            loop
            playsInline
          />
        )}

        <div class="w-20 h-20 rounded-box bg-base-200 flex items-center justify-center shrink-0 overflow-hidden">
          {a.iconUrl ? (
            <img src={a.iconUrl} alt="" width={80} height={80} class="w-full h-full object-cover" />
          ) : (
            <LuPackage class="text-4xl text-base-content/40" />
          )}
        </div>

        <div class="flex-1 min-w-0">
          <h1 class="text-3xl font-bold">{a.name}</h1>
          <p class="text-base-content/70 mt-1">{a.shortDescription}</p>
          {a.developer && (
            <p class="text-sm text-base-content/60 mt-1">
              by{" "}
              {a.homepage ? (
                <a href={a.homepage} class="link link-hover" target="_blank" rel="noopener">
                  {a.developer}
                </a>
              ) : (
                a.developer
              )}
            </p>
          )}

          <div class="flex flex-wrap items-center gap-2 mt-3">
            {a.contentType === "game" && <span class="badge badge-accent">Game</span>}
            {a.rating && (
              <UnifiedRating
                average={a.rating.average}
                count={a.rating.count}
                bySource={summarizeRatingsBySource(a.packages)}
              />
            )}
            {a.category && <span class="badge badge-outline">{a.category}</span>}
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
        </div>

        <div class="flex flex-wrap items-center gap-3">
          {visiblePackages.length ? (
            <>
              <SourceSummary {...summarizeSources(visiblePackages)} tooltipPosition="bottom" />
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
          ) : (
            <span class="btn btn-disabled btn-sm" aria-disabled="true">
              No install source available
            </span>
          )}
        </div>
      </section>

      {/* Suite main app: link out to each separately-installable component. */}
      {a.suite?.role === "main" && a.suite.components && a.suite.components.length > 0 && (
        <section>
          <h2 class="text-lg font-semibold mb-1">Suite components</h2>
          <p class="text-sm text-base-content/60 mb-3">
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
            {groupPackagesBySourceGroup(visiblePackages).map(([group, packages]) => (
              <SourceGroupSection
                key={group}
                group={group}
                packages={packages}
                appHomepage={a.homepage}
                compatWarnings={a.compatibilityWarnings}
              />
            ))}
          </div>
        </div>
      )}

      {a.screenshots?.length || a.videos?.length ? (
        <section>
          <h2 class="text-lg font-semibold mb-3">Screenshots & videos</h2>
          <div class="flex gap-3 overflow-x-auto">
            {a.screenshots?.map((src) => (
              <img key={src} src={src} alt="" class="h-48 rounded-box shrink-0" />
            ))}
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

      {a.changelog ? (
        <section>
          <h2 class="text-lg font-semibold mb-2">Changelog</h2>
          <p class="whitespace-pre-line text-base-content/80">{a.changelog}</p>
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

      <section>
        <h2 class="text-lg font-semibold mb-2">Additional information</h2>
        <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
          {a.developer && (
            <>
              <dt class="text-base-content/60">Developer</dt>
              <dd>
                {a.homepage ? (
                  <a href={a.homepage} class="link link-hover" target="_blank" rel="noopener">
                    {a.developer}
                  </a>
                ) : (
                  a.developer
                )}
              </dd>
            </>
          )}
          {a.publisher && (
            <>
              <dt class="text-base-content/60">Publisher</dt>
              <dd>
                {a.homepage ? (
                  <a href={a.homepage} class="link link-hover" target="_blank" rel="noopener">
                    {a.publisher}
                  </a>
                ) : (
                  a.publisher
                )}
              </dd>
            </>
          )}
          {a.license && (
            <>
              <dt class="text-base-content/60">License</dt>
              <dd>{a.license}</dd>
            </>
          )}
          {a.category && (
            <>
              <dt class="text-base-content/60">Category</dt>
              <dd>{a.category}</dd>
            </>
          )}
          {a.languages?.length && (
            <>
              <dt class="text-base-content/60">Languages</dt>
              <dd>{a.languages.join(", ")}</dd>
            </>
          )}
          {a.approxSizeBytes && (
            <>
              <dt class="text-base-content/60">Size</dt>
              <dd>{formatBytes(a.approxSizeBytes)}</dd>
            </>
          )}
          {a.permissions?.length && (
            <>
              <dt class="text-base-content/60">Permissions</dt>
              <dd>{a.permissions.join(", ")}</dd>
            </>
          )}
          {a.gdprCompliant !== undefined && (
            <>
              <dt class="text-base-content/60">GDPR</dt>
              <dd>{a.gdprCompliant ? "Compliant" : "Not stated"}</dd>
            </>
          )}
          {a.homepage && (
            <>
              <dt class="text-base-content/60">Homepage</dt>
              <dd>
                <a href={a.homepage} class="link link-primary" target="_blank" rel="noopener">
                  {a.homepage}
                </a>
              </dd>
            </>
          )}
          <dt class="text-base-content/60">Available via</dt>
          <dd>{a.packages.map((pkg) => formatSourceLabel(pkg)).join(", ")}</dd>
          {stats.value.generatedAt && (
            <>
              <dt class="text-base-content/60">Catalog data as of</dt>
              <dd>
                {new Date(stats.value.generatedAt).toLocaleDateString()}{" "}
                <span class="text-base-content/50">
                  (dataset snapshot date — per-app update dates aren't tracked yet)
                </span>
              </dd>
            </>
          )}
        </dl>

        <a
          href={`https://github.com/tuxery/app/issues/new?title=${encodeURIComponent(`Report: ${a.name}`)}`}
          class="btn btn-ghost btn-sm gap-1.5 mt-4"
          target="_blank"
          rel="noopener"
        >
          <LuFlag class="text-base" />
          Report this app
        </a>
      </section>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const app = resolveValue(useApp);
  return {
    title: app ? `${app.name} — Tuxery` : "App not found — Tuxery",
    meta: app ? [{ name: "description", content: app.shortDescription }] : [],
  };
};

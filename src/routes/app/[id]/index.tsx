import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuCheck, LuCopy, LuFlag, LuPackage } from "@qwikest/icons/lucide";
import { getAppById, getStats } from "~/catalog";
import {
  ALL_SOURCE_GROUPS,
  formatBytes,
  SOURCE_GROUP_MEMBERS,
  SOURCE_LABELS,
  type CatalogApp,
  type PackageSourceId,
  type SourcedPackage,
} from "~/catalog-types";
import { INSTALL_METHODS, installCommand } from "~/install-methods";
import {
  setSourceActivated,
  useSettings,
  type InstallFormatGroup,
  type InstallSourceOption,
} from "~/settings";

export const useApp = routeLoader$(async (requestEvent): Promise<CatalogApp | null> => {
  const id = decodeURIComponent(requestEvent.params.id ?? "");
  const app = await getAppById(id);
  if (!app) requestEvent.status(404);
  return app;
});

export const useDetailStats = routeLoader$(async () => getStats());

// Settings' install-source leaves are more granular than PackageSourceId
// (e.g. Ubuntu's "Universe" component vs. AUR/official being two distinct
// Arch sources) — this maps each leaf to the source id it actually installs.
const SOURCE_ID_TO_PACKAGE_SOURCE: Record<string, PackageSourceId> = {
  flathub: "flatpak-flathub",
  "elementary-appcenter": "flatpak-appcenter",
  "snap-store": "snap-snapcraft",
  appimagehub: "appimage",
  "appimage-manual": "appimage-manual",
  "arch-aur": "pacman-aur",
  "arch-official": "pacman-arch",
  "debian-main": "deb-debian",
  "ubuntu-main": "deb-ubuntu",
  "ubuntu-universe": "deb-ubuntu",
  "mint-main": "deb-mint",
  "popos-main": "deb-popos",
  "deepin-main": "deb-deepin",
  "mxlinux-main": "deb-mxlinux",
  "fedora-everything": "rpm-fedora",
  "opensuse-oss": "rpm-opensuse",
  "rpmfusion-main": "rpm-rpmfusion",
  "alpine-main": "apk-alpine",
  "void-main": "xbps-void",
  "slackware-main": "slackware",
  "solus-shannon": "eopkg-solus",
  "gentoo-portage": "ebuild-gentoo",
  "nixpkgs-main": "nix-nixpkgs",
  "gog-main": "gog",
  "lutris-main": "lutris",
};

/** Packages sorted by the user's install-source preference order from settings; sources the settings don't cover sort last, in their original order. A package with a `channel` (currently only AUR's git/svn/hg/bzr/cvs rolling-release builds) always sorts after its channel-less twin from the same source, so "automatic" mode never silently picks a dev build over the official one. */
function orderPackagesByPreference(
  packages: SourcedPackage[],
  installGroups: InstallFormatGroup[],
): SourcedPackage[] {
  const preferenceOrder: PackageSourceId[] = [];
  for (const group of installGroups) {
    if (!group.enabled) continue;
    for (const source of group.sources) {
      if (!source.enabled) continue;
      const mapped = SOURCE_ID_TO_PACKAGE_SOURCE[source.id];
      if (mapped && !preferenceOrder.includes(mapped)) preferenceOrder.push(mapped);
    }
  }
  const copy = [...packages];
  // oxlint-disable-next-line unicorn/no-array-sort -- `copy` is a fresh array; toSorted needs ES2023 lib
  copy.sort((a, b) => {
    const ai = preferenceOrder.indexOf(a.source);
    const bi = preferenceOrder.indexOf(b.source);
    if (ai !== bi) {
      return (ai === -1 ? preferenceOrder.length : ai) - (bi === -1 ? preferenceOrder.length : bi);
    }
    return (a.channel ? 1 : 0) - (b.channel ? 1 : 0);
  });
  return copy;
}

/** A source label, qualified with its channel when it has one (currently only AUR's -git/-svn/-hg/-bzr/-cvs rolling-release builds) — so a merged "official + dev build" pair reads as two distinct install options, not a duplicate. */
function formatSourceLabel(pkg: SourcedPackage): string {
  const label = SOURCE_LABELS[pkg.source];
  return pkg.channel ? `${label} (${pkg.channel} build)` : label;
}

// Reverse of SOURCE_ID_TO_PACKAGE_SOURCE — only meaningfully used for the
// handful of sources with a real InstallMethod.setup step (Flathub,
// AppCenter, AUR, Snap, RPM Fusion), each of which maps from exactly one
// leaf id; the ambiguous cases (deb-ubuntu from two leaves) never have a
// setup step, so picking "whichever mapped last" for those is harmless.
const PACKAGE_SOURCE_TO_LEAF_ID: Partial<Record<PackageSourceId, string>> = Object.fromEntries(
  Object.entries(SOURCE_ID_TO_PACKAGE_SOURCE).map(([leaf, source]) => [source, leaf]),
);

function findSourceOption(
  installGroups: InstallFormatGroup[],
  leafId: string,
): InstallSourceOption | undefined {
  for (const group of installGroups) {
    const found = group.sources.find((source) => source.id === leafId);
    if (found) return found;
  }
  return undefined;
}

/** Packages bucketed by platform/distro group (same grouping as the app-card dot-map), in the order their first member appears — i.e. still respecting the caller's own preference sort. */
function groupPackagesBySourceGroup(packages: SourcedPackage[]): Map<string, SourcedPackage[]> {
  const byGroup = new Map<string, SourcedPackage[]>();
  for (const pkg of packages) {
    const group = ALL_SOURCE_GROUPS.find((g) => SOURCE_GROUP_MEMBERS[g]?.includes(pkg.source));
    const key = group ?? "Other";
    const list = byGroup.get(key) ?? [];
    list.push(pkg);
    byGroup.set(key, list);
  }
  return byGroup;
}

/**
 * One package's row inside the install drawer — a direct link when the
 * source has a real install/store page (`INSTALL_METHODS[source].kind ===
 * "link"`), otherwise a copy-paste shell command, since no `apt://`-style
 * link reliably works across distros/desktops today. When the source
 * needs a one-time remote/helper setup first and the user hasn't
 * confirmed it yet, that step shows above the regular command with a
 * button to mark it done — persisted, so it only shows once per source.
 */
const PackageInstallRow = component$<{
  pkg: SourcedPackage;
  appHomepage: string | undefined;
}>(({ pkg, appHomepage }) => {
  const copied = useSignal(false);
  const settings = useSettings();
  const method = INSTALL_METHODS[pkg.source];
  const leafId = PACKAGE_SOURCE_TO_LEAF_ID[pkg.source];
  const sourceOption = leafId ? findSourceOption(settings.installGroups.value, leafId) : undefined;

  if (method.kind === "link") {
    const link = pkg.homepage ?? appHomepage;
    return link ? (
      <a href={link} class="btn btn-outline btn-block justify-start" target="_blank" rel="noopener">
        Install via {formatSourceLabel(pkg)}
      </a>
    ) : (
      <div class="border border-base-300 rounded-box p-3 text-sm text-base-content/60">
        {formatSourceLabel(pkg)}: no direct link available yet.
      </div>
    );
  }

  const command = installCommand(pkg);
  const needsSetup = method.setup && !sourceOption?.activated;

  return (
    <div class="border border-base-300 rounded-box p-3 flex flex-col gap-2">
      <span class="text-sm font-medium">{formatSourceLabel(pkg)}</span>

      {needsSetup && method.setup && (
        <div class="bg-base-200 rounded-field p-2 flex flex-col gap-2">
          <p class="text-xs text-base-content/60">{method.setup.note}</p>
          <code class="text-xs font-mono break-all">{method.setup.command}</code>
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
      )}

      {command && (
        <div class="flex items-center gap-2">
          <code class="text-xs font-mono break-all flex-1">{command}</code>
          <button
            type="button"
            class="btn btn-xs btn-square btn-ghost"
            aria-label="Copy install command"
            onClick$={() => {
              navigator.clipboard.writeText(command);
              copied.value = true;
            }}
          >
            {copied.value ? <LuCheck /> : <LuCopy />}
          </button>
        </div>
      )}
    </div>
  );
});

/** One `<details>` per platform/distro group — collapsed by default so the drawer reads as a scannable list of sources, not a wall of commands. */
const SourceGroupSection = component$<{
  group: string;
  packages: SourcedPackage[];
  appHomepage: string | undefined;
}>(({ group, packages, appHomepage }) => (
  <details class="border border-base-300 rounded-box" open={packages.length === 1}>
    <summary class="cursor-pointer select-none px-3 py-2 font-medium text-sm">{group}</summary>
    <div class="flex flex-col gap-2 p-3 pt-0">
      {packages.map((pkg) => (
        <PackageInstallRow key={`${pkg.source}:${pkg.name}`} pkg={pkg} appHomepage={appHomepage} />
      ))}
    </div>
  </details>
));

export default component$(() => {
  const app = useApp();
  const stats = useDetailStats();
  const settings = useSettings();
  const a = app.value;

  const jumboRef = useSignal<HTMLElement>();
  const showStickyBar = useSignal(false);
  const drawerOpen = useSignal(false);
  const noLinkModalOpen = useSignal(false);

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

  const orderedPackages = orderPackagesByPreference(a.packages, settings.installGroups.value);
  const bestPkg = orderedPackages[0];
  const bestPkgLink = bestPkg ? (bestPkg.homepage ?? a.homepage) : undefined;
  const automatic = settings.ctaBehavior.value === "automatic";

  return (
    <div class="flex flex-col gap-10">
      {showStickyBar.value && (
        <div class="fixed top-16 inset-x-0 z-30 bg-base-200/95 backdrop-blur border-b border-base-300">
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
            {automatic ? (
              bestPkgLink ? (
                <a href={bestPkgLink} class="btn btn-primary btn-sm" target="_blank" rel="noopener">
                  Install
                </a>
              ) : (
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  onClick$={() => (noLinkModalOpen.value = true)}
                >
                  Install
                </button>
              )
            ) : (
              <button
                type="button"
                class="btn btn-primary btn-sm"
                onClick$={() => (drawerOpen.value = true)}
              >
                Install
              </button>
            )}
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

          <div class="flex flex-wrap gap-2 mt-3">
            {a.kind === "gui" && <span class="badge badge-secondary">GUI</span>}
            {a.contentType === "game" && <span class="badge badge-accent">Game</span>}
            {a.developer && <span class="badge badge-ghost">{a.developer}</span>}
            {a.category && <span class="badge badge-outline">{a.category}</span>}
            {a.suite?.role === "component" && a.suite.mainApp && (
              <a
                href={`/app/${encodeURIComponent(a.suite.mainApp.id)}/`}
                class="badge badge-outline hover:badge-primary"
              >
                Part of {a.suite.mainApp.name}
              </a>
            )}
            {a.rating && (
              <span class="badge badge-outline">
                ★ {a.rating.average.toFixed(1)} ({a.rating.count})
              </span>
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

        <div class="flex flex-wrap gap-2 md:flex-col">
          {automatic ? (
            bestPkg ? (
              bestPkgLink ? (
                <a href={bestPkgLink} class="btn btn-primary btn-sm" target="_blank" rel="noopener">
                  Install via {formatSourceLabel(bestPkg)}
                </a>
              ) : (
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  onClick$={() => (noLinkModalOpen.value = true)}
                >
                  Install via {formatSourceLabel(bestPkg)}
                </button>
              )
            ) : (
              <span class="btn btn-disabled btn-sm" aria-disabled="true">
                No install source available
              </span>
            )
          ) : orderedPackages.length ? (
            <button
              type="button"
              class="btn btn-primary btn-sm"
              onClick$={() => (drawerOpen.value = true)}
            >
              Install options ({orderedPackages.length})
            </button>
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
          <div class="relative w-full max-w-sm bg-base-100 h-full shadow-xl p-5 flex flex-col gap-3 overflow-y-auto">
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
            {[...groupPackagesBySourceGroup(orderedPackages)].map(([group, packages]) => (
              <SourceGroupSection
                key={group}
                group={group}
                packages={packages}
                appHomepage={a.homepage}
              />
            ))}
          </div>
        </div>
      )}

      {/* Automatic mode fallback: chosen source has no direct link to hand off to. */}
      {noLinkModalOpen.value && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            class="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick$={() => (noLinkModalOpen.value = false)}
          />
          <div class="relative bg-base-100 rounded-box shadow-xl p-5 max-w-sm">
            <h2 class="text-lg font-semibold mb-2">No direct install link</h2>
            <p class="text-sm text-base-content/70 mb-4">
              {bestPkg
                ? `"${a.name}" is available via ${formatSourceLabel(bestPkg)}, but that source doesn't expose a direct link yet — search for it there instead.`
                : "No package source is available for this app yet."}
            </p>
            <button
              type="button"
              class="btn btn-primary btn-block"
              onClick$={() => (noLinkModalOpen.value = false)}
            >
              Got it
            </button>
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

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 items-start">
        <section>
          <h2 class="text-lg font-semibold mb-2">Additional information</h2>
          <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
            {a.developer && (
              <>
                <dt class="text-base-content/60">Developer</dt>
                <dd>{a.developer}</dd>
              </>
            )}
            {a.publisher && (
              <>
                <dt class="text-base-content/60">Publisher</dt>
                <dd>{a.publisher}</dd>
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
            {a.packages.some((pkg) => pkg.rating) && (
              <>
                <dt class="text-base-content/60">Ratings by source</dt>
                <dd>
                  {a.packages
                    .filter((pkg) => pkg.rating)
                    .map((pkg) => (
                      <span key={`${pkg.source}:${pkg.name}`} class="mr-3 whitespace-nowrap">
                        {formatSourceLabel(pkg)}: ★ {pkg.rating?.average.toFixed(1)} (
                        {pkg.rating?.count})
                      </span>
                    ))}
                </dd>
              </>
            )}
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

        <aside class="border border-base-300 rounded-box p-4 h-fit">
          <h2 class="text-sm font-semibold mb-2">Alternatives</h2>
          <p class="text-sm text-base-content/60">Similar app suggestions are coming soon.</p>
        </aside>
      </div>
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

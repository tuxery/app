import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

type RowStatus = "complete" | "partial" | "planned" | "deferred";

interface SourceRow {
  type: string;
  source: string;
  status: RowStatus;
  desc: string;
  count?: string;
  x86?: boolean;
  x64?: boolean;
  arm64?: boolean;
  /** Card title(s) on the Tuxery GitHub Project — no per-card link exists (draft cards, not repo issues), so shown as text rather than a URL we'd have to guess. */
  roadmap?: string[];
}

const STATUS_LABEL: Record<RowStatus, string> = {
  complete: "Complete",
  partial: "Partial",
  planned: "Planned",
  deferred: "Deferred",
};

const STATUS_BADGE: Record<RowStatus, string> = {
  complete: "badge-success",
  partial: "badge-warning",
  planned: "badge-info",
  deferred: "badge-ghost",
};

// Kept in sync by hand with catalog's docs/sources.md and the Tuxery
// GitHub Project — no cross-repo import (separate repos), same
// convention as catalog.ts itself.
const ROWS: SourceRow[] = [
  {
    type: "Flatpak",
    source: "Flathub",
    status: "complete",
    desc: "Canonical catalog, single appstream dump",
    count: "~3,300",
    x64: true,
  },
  {
    type: "Flatpak",
    source: "Other remotes",
    status: "planned",
    desc: "GNOME nightly, KDE kdeapps, Fedora's own — mostly testing builds, not curated apps",
    roadmap: ["Evaluate other Flatpak remotes beyond Flathub"],
  },
  {
    type: "Snap",
    source: "Snap Store",
    status: "partial",
    desc: "Capped category sweep, 100 results/category",
    count: "~1,500",
    roadmap: ["Fix Snapcraft exhaustiveness"],
  },
  {
    type: "AppImage",
    source: "AppImageHub",
    status: "partial",
    desc: "Community list; ~22% skipped (no resolvable GitHub link); no version numbers yet",
    count: "~1,100",
    roadmap: ["Fix AppImage exhaustiveness and veracity", "AppImage version resolution via GitHub Releases"],
  },
  {
    type: "Native",
    source: "Arch Linux — AUR",
    status: "complete",
    desc: "Full community-package dump, regenerated every ~5 min upstream",
    count: "~117,500",
  },
  {
    type: "Native",
    source: "Arch Linux — Official",
    status: "partial",
    desc: "core + extra only, multilib skipped",
    count: "~15,200",
    x64: true,
  },
  {
    type: "Native",
    source: "Debian — Main",
    status: "partial",
    desc: "stable/main only — contrib/non-free not fetched",
    count: "~68,800",
    x64: true,
  },
  {
    type: "Native",
    source: "Ubuntu — Main",
    status: "partial",
    desc: "resolute/main only",
    count: "~6,500",
    x64: true,
  },
  {
    type: "Native",
    source: "Ubuntu — Universe",
    status: "partial",
    desc: "resolute/universe only — restricted/multiverse not fetched",
    count: "~66,700",
    x64: true,
  },
  {
    type: "Native",
    source: "Fedora — Everything",
    status: "partial",
    desc: "Release 44 only",
    count: "~76,400",
    x64: true,
  },
  {
    type: "Native",
    source: "Other distros",
    status: "planned",
    desc: "openSUSE, Alpine, NixOS/nixpkgs, Void, Gentoo, Solus, Clear Linux, Slackware",
    roadmap: ["Other native package managers: openSUSE, Alpine, NixOS/nixpkgs, Void, Gentoo, Solus, Clear Linux, Slackware"],
  },
  {
    type: "Any",
    source: "GitHub Releases",
    status: "deferred",
    desc: "Not exhaustive by nature (no catalog exists) — needs a curated scope before it's worth building",
    roadmap: ["GitHub Releases connector: source discovery + normalization"],
  },
];

function Check({ value }: { value?: boolean }) {
  return <span class={value ? "text-success" : "text-base-content/20"}>{value ? "✓" : "–"}</span>;
}

export default component$(() => {
  return (
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-3xl font-bold mb-2">Source status</h1>
        <p class="text-base-content/70 max-w-2xl">
          Every source Tuxery pulls from or plans to, what's actually implemented today, and the
          architectures each fetch covers. Card titles below match cards on the{" "}
          <a
            href="https://github.com/orgs/tuxery/projects/1"
            class="link link-primary"
            target="_blank"
            rel="noopener"
          >
            Tuxery GitHub Project
          </a>{" "}
          — draft cards there have no individual URL to link to directly, so titles are shown as
          plain text.
        </p>
      </div>

      <div class="overflow-x-auto border border-base-300 rounded-box">
        <table class="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Source</th>
              <th>Status</th>
              <th>Description</th>
              <th>Apps/games</th>
              <th class="text-center">x86</th>
              <th class="text-center">x64</th>
              <th class="text-center">ARM64</th>
              <th>Roadmap</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={`${row.type}-${row.source}`}>
                <td class="whitespace-nowrap">{row.type}</td>
                <td class="whitespace-nowrap font-medium">{row.source}</td>
                <td>
                  <span class={["badge badge-sm", STATUS_BADGE[row.status]]}>{STATUS_LABEL[row.status]}</span>
                </td>
                <td class="text-base-content/70 min-w-56">{row.desc}</td>
                <td class="whitespace-nowrap">{row.count ?? "–"}</td>
                <td class="text-center">
                  <Check value={row.x86} />
                </td>
                <td class="text-center">
                  <Check value={row.x64} />
                </td>
                <td class="text-center">
                  <Check value={row.arm64} />
                </td>
                <td class="text-base-content/60 text-sm min-w-48">
                  {row.roadmap?.map((title) => <div key={title}>"{title}"</div>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Source status — Tuxery",
  meta: [
    {
      name: "description",
      content: "Detailed status per source: what's implemented, architecture coverage, and what's on the roadmap.",
    },
  ],
};

import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

type RowStatus = "complete" | "partial" | "planned";

interface SourceRow {
  type: string;
  source?: string;
  status: RowStatus;
  desc?: string;
  count?: string;
  arch?: string;
}

const STATUS_LABEL: Record<RowStatus, string> = {
  complete: "Complete",
  partial: "Partial",
  planned: "Planned",
};

const STATUS_BADGE: Record<RowStatus, string> = {
  complete: "badge-success",
  partial: "badge-warning",
  planned: "badge-info",
};

// Kept in sync by hand with catalog's docs/sources.md — no cross-repo
// import (separate repos), same convention as catalog.ts itself.
const ROWS: SourceRow[] = [
  { type: "Flatpak", source: "Flathub", status: "complete", desc: "Canonical catalog", count: "~3,300", arch: "x64" },
  { type: "Flatpak", source: "GNOME nightly", status: "planned" },
  { type: "Flatpak", source: "KDE kdeapps", status: "planned" },
  { type: "Flatpak", source: "Fedora's remote", status: "planned" },
  { type: "Snap", source: "Snap Store", status: "partial", desc: "Capped sweep, 100/category", count: "~1,500" },
  {
    type: "AppImage",
    source: "AppImageHub",
    status: "partial",
    desc: "~22% skipped, no version numbers yet",
    count: "~1,100",
  },
  { type: "Ubuntu", source: "Main", status: "partial", desc: "resolute only", count: "~6,500", arch: "x64" },
  { type: "Ubuntu", source: "Universe", status: "partial", desc: "resolute only", count: "~66,700", arch: "x64" },
  { type: "Debian", source: "Main", status: "partial", desc: "stable only", count: "~68,800", arch: "x64" },
  { type: "Fedora", source: "Everything", status: "partial", desc: "Release 44 only", count: "~76,400", arch: "x64" },
  { type: "Arch Linux", source: "AUR", status: "complete", desc: "Full dump", count: "~117,500" },
  {
    type: "Arch Linux",
    source: "Official",
    status: "partial",
    desc: "core + extra, no multilib",
    count: "~15,200",
    arch: "x64",
  },
  { type: "openSUSE", status: "planned" },
  { type: "Alpine", status: "planned" },
  { type: "NixOS/nixpkgs", status: "planned", desc: "Different paradigm" },
  { type: "Void", status: "planned" },
  { type: "Gentoo", status: "planned", desc: "Low priority" },
  { type: "Solus", status: "planned", desc: "Low priority" },
  { type: "Clear Linux", status: "planned", desc: "Low priority" },
  { type: "Slackware", status: "planned", desc: "Low priority" },
  { type: "GitHub Releases", status: "planned", desc: "TBD" },
];

export default component$(() => {
  return (
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-3xl font-bold mb-2">Source status</h1>
        <p class="text-base-content/70 max-w-2xl">
          Every source Tuxery pulls from or plans to, and what's actually implemented today. See
          the{" "}
          <a
            href="https://github.com/orgs/tuxery/projects/1"
            class="link link-primary"
            target="_blank"
            rel="noopener"
          >
            Tuxery GitHub Project
          </a>{" "}
          for how this maps to tracked work.
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
              <th>Architecture</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={`${row.type}-${row.source ?? ""}`}>
                <td class="whitespace-nowrap font-medium">{row.type}</td>
                <td class="whitespace-nowrap text-base-content/70">{row.source ?? "–"}</td>
                <td>
                  <span class={["badge badge-sm", STATUS_BADGE[row.status]]}>{STATUS_LABEL[row.status]}</span>
                </td>
                <td class="text-base-content/70">{row.desc ?? "–"}</td>
                <td class="whitespace-nowrap">{row.count ?? "–"}</td>
                <td class="whitespace-nowrap">{row.arch ?? "–"}</td>
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
      content: "Detailed status per source: what's implemented, coverage, and what's planned.",
    },
  ],
};

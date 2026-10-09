// The docs' public changelog (/docs/changelog/) — a short hand-written
// summary per release, newest first, of what changed on the site (`app`)
// and in the data (`catalog`). Written from both repos' feat/fix commit
// history; the full detail stays there (linked from the page).
//
// Grouped by month until the app and the catalog get version numbers
// (see the "App version number (web)" and "Catalog version number
// (algorithm)" board cards) — then each entry gains its versions.

export interface ChangelogEntry {
  /** `YYYY-MM`, the month the changes shipped. */
  month: string;
  site: string[];
  data: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    month: "2026-10",
    site: [
      "A docs section: about, status, roadmap, FAQ, guides (formats, rankings, glossary), how the data is built, open data and legal pages, with one Docs entry in the header.",
      "App pages show one edition and version at a time (Firefox ESR, Beta, Nightly...), each with its own address, install options and release facts.",
      "Add-ons and related apps (forks, successors, suite components) listed on each app's page.",
      "Install options show who built each package: official, distribution or community build.",
      "Vendor repositories (Chrome, VS Code, Brave...) as an install option.",
      "Faster browsing by source, and faster search.",
    ],
    data: [
      "Product families: builds, editions and versions of the same app folded into one card — Firefox went from 61 search results to one.",
      "10,842 add-ons (extensions, themes, language packs) attached to their app instead of listed as apps.",
      "Relations between apps, each backed by what the packages declare or a reviewed rule.",
      "New source: first-party vendor apt repositories.",
      "Language models can now flag libraries and non-apps, which are left out when the verdict is confident.",
      "A full-text search index built with every publication.",
    ],
  },
  {
    month: "2026-09",
    site: [
      "Live on tuxery.store, served from Cloudflare's edge.",
      "The new Tuxery logo.",
      "Homepage, category and store lists precomputed, so pages load faster.",
    ],
    data: [
      "AppStream metadata from Debian, Ubuntu, Fedora, openSUSE and Arch: icons, screenshots, categories and developers for thousands more apps.",
      "The full Snap Store category sweep: about 10,900 snaps, three times more than before.",
      "Lutris games get their genres and real descriptions; Debian's own game tags are used.",
      "Tens of thousands of apps classified by rules on names, descriptions and distribution sections, then by language models, each verdict with a confidence.",
    ],
  },
  {
    month: "2026-08",
    site: [
      "First version: homepage, app pages with every install option, search and browse with filters, apps, games and category pages.",
      "Settings: your operating system, preferred formats and theme, kept in your browser.",
      "Store pages for Flathub, the Snap Store, GOG and Lutris.",
      "Verified publishers, combined ratings, download trends and new games.",
    ],
    data: [
      "Some twenty-five sources: Flathub, the Snap Store, AppImage, the AUR, Arch, Debian, Ubuntu, Fedora, openSUSE, Nixpkgs, Alpine, Void, Slackware, Solus, Gentoo, elementary AppCenter, Mint, Pop!_OS, Deepin, MX Linux, RPM Fusion, GOG, Lutris and GitHub releases.",
      "Libraries, fonts, documentation and other non-apps filtered out; the same app matched across sources.",
      "Ratings combined from GNOME's review service and GOG; popularity from the AUR and Flathub.",
      "Apps and games told apart, graphical apps from command-line tools.",
    ],
  },
];

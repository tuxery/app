import { component$, Slot } from "@qwik.dev/core";
import { CategoryIcon } from "~/components/category-icon/category-icon";
import { categoryPageHref } from "~/categories";
import {
  BlockPlaceholder,
  RankedList,
  SectionHeader,
} from "~/components/home-sections/home-sections";
import { LogoChip } from "~/components/logo/logo";
import type { CategoryCount } from "~/catalog";
import { SOURCE_LABELS, type AppSummary, type PackageSourceId } from "~/catalog-types";
import { SOURCE_LOGOS } from "~/data/logos";
import { STORE_PAGES } from "~/data/store-pages";

/** A box of the side column. */
const AsideCard = component$(() => (
  <section class="card bg-base-200/50 border border-base-300">
    <div class="card-body p-4 gap-3">
      <Slot />
    </div>
  </section>
));

/** A Top 10 chart in the side column: numbered lines, no stars (too narrow for them). */
export const TopTen = component$<{
  title: string;
  href: string;
  tip?: string;
  apps?: AppSummary[];
}>(({ title, href, tip, apps }) => (
  <AsideCard>
    <SectionHeader eyebrow="Top 10" title={title} tip={tip} href={href} />
    {apps === undefined ? (
      <BlockPlaceholder class="h-[36rem]" />
    ) : (
      <RankedList apps={apps.slice(0, 10)} label={title} columns={1} />
    )}
  </AsideCard>
));

const CategoryLines = component$<{ title: string; categories: CategoryCount[] }>(
  ({ title, categories }) => (
    <div>
      <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70 px-2 mb-1">
        {title}
      </h3>
      <ul class="flex flex-col">
        {categories.map(({ category, count }) => (
          <li key={category}>
            <a
              href={categoryPageHref(category)}
              class="flex items-center justify-between gap-2 rounded-box px-2 py-1 hover:bg-base-200 text-sm"
            >
              <span class="flex items-center gap-2 min-w-0">
                <CategoryIcon category={category} class="text-primary shrink-0" />
                <span class="truncate">{category}</span>
              </span>
              <span class="text-xs text-base-content/70 tabular-nums">
                {count.toLocaleString()}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  ),
);

/** The compact category list: the app categories, then the game genres, with their counts. */
export const CategoryList = component$<{ apps: CategoryCount[]; games: CategoryCount[] }>(
  ({ apps, games }) => (
    <AsideCard>
      <SectionHeader title="Categories" href="/categories/" linkLabel="All" />
      {apps.length > 0 && <CategoryLines title="Apps" categories={apps} />}
      {games.length > 0 && <CategoryLines title="Games" categories={games} />}
    </AsideCard>
  ),
);

// GOG is left out while its fetch is paused (its User Agreement forbids
// extraction tools; tuxery/catalog#139): no new GOG games come in until GOG
// answers. Its store page stays reachable from /docs/sources/.
const HIDDEN_STORES: ReadonlySet<PackageSourceId> = new Set(["gog"]);

/** The distributions' own repositories, each a /browse filter on that source. */
const DISTRO_SOURCES: readonly { id: PackageSourceId; logo: string }[] = [
  { id: "deb-debian", logo: "debian" },
  { id: "deb-ubuntu", logo: "ubuntu" },
  { id: "rpm-fedora", logo: "fedora" },
  { id: "pacman-arch", logo: "archlinux" },
  { id: "pacman-aur", logo: "archlinux" },
  { id: "rpm-opensuse", logo: "opensuse" },
  { id: "nix-nixpkgs", logo: "nixos" },
  { id: "brew-homebrew", logo: "homebrew" },
];

/**
 * Where the apps come from: the stores with a page of their own, then the
 * distributions' repositories. Logos on white chips, so the brands' colors
 * don't fight the page.
 */
export const StoreList = component$(() => (
  <AsideCard>
    <SectionHeader title="Stores" href="/docs/sources/" linkLabel="All sources" />
    <ul class="flex flex-col gap-1">
      {STORE_PAGES.filter((store) => !HIDDEN_STORES.has(store.id)).map((store) => (
        <li key={store.id}>
          <a
            href={`/sources/${store.id}/`}
            class="flex items-center gap-3 rounded-box px-2 py-1.5 hover:bg-base-200"
          >
            <LogoChip slug={SOURCE_LOGOS[store.id]} />
            <span class="min-w-0">
              <span class="block text-sm font-semibold">{store.name}</span>
              <span class="block text-xs text-base-content/70 truncate">{store.summary}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
    <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70 px-2">
      And the distributions' repositories
    </h3>
    <ul class="grid grid-cols-2 gap-1">
      {DISTRO_SOURCES.map(({ id, logo }) => (
        <li key={id} class="min-w-0">
          <a
            href={`/browse/?source=${id}`}
            class="flex items-center gap-2 rounded-box px-2 py-1 hover:bg-base-200 text-sm"
          >
            <LogoChip slug={logo} size="sm" />
            <span class="truncate">{SOURCE_LABELS[id]}</span>
          </a>
        </li>
      ))}
    </ul>
  </AsideCard>
));

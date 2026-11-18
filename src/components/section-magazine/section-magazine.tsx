import { component$ } from "@qwik.dev/core";
import { AppCardLink } from "~/components/app-card/app-card";
import { HorizontalScroller } from "~/components/horizontal-scroller/horizontal-scroller";
import {
  BlockPlaceholder,
  Collection,
  CompactGrid,
  FeaturedApp,
  RankedList,
  SectionHeader,
  SpotlightRow,
} from "~/components/home-sections/home-sections";
import type { AppSummary } from "~/catalog-types";
import { dailyPick } from "~/daily-pick";
import { categoryBlurb } from "~/data/category-blurbs";
import {
  homeRowsOf,
  MUST_HAVE,
  type HomeRow,
  type HomeRows,
  type HomeSectionId,
} from "~/home-rows";

/** How many of the trending games take turns as the game of the day. */
const GAME_OF_THE_DAY_POOL = 10;

/** Where the app of the day is picked from, and what its badge says. */
const FEATURED = {
  apps: { eyebrow: "App of the day" },
  games: { eyebrow: "Game of the day" },
} as const;

/**
 * Whether a row is drawn: always while the rows load (its placeholder holds
 * the place), then only with cards or a message saying why it has none.
 */
const isDrawn = (row: HomeRow, apps: AppSummary[] | undefined) =>
  apps === undefined || apps.length > 0 || row.emptyMessage !== undefined;

const EmptyRow = component$<{ message: string }>(({ message }) => (
  <div class="border border-dashed border-base-300 rounded-box p-6 text-sm text-base-content/70">
    {message}
  </div>
));

/** A block under its header: its placeholder while loading, its empty message, or its cards. */
const Block = component$<{
  row: HomeRow;
  apps?: AppSummary[];
  eyebrow?: string;
  placeholder: string;
  kind: "ranked" | "spotlight" | "compact" | "cards";
}>(({ row, apps, eyebrow, placeholder, kind }) => (
  <section>
    <SectionHeader
      level={2}
      eyebrow={eyebrow}
      title={row.title}
      tip={row.tip}
      href={row.href}
      linkLabel={row.category ? "See all" : "Browse everything"}
    />
    {apps === undefined ? (
      <BlockPlaceholder class={placeholder} />
    ) : apps.length === 0 ? (
      <EmptyRow message={row.emptyMessage ?? ""} />
    ) : kind === "ranked" ? (
      <RankedList apps={apps.slice(0, 10)} label={row.title} />
    ) : kind === "spotlight" ? (
      <SpotlightRow apps={apps} label={row.title} />
    ) : kind === "compact" ? (
      <CompactGrid apps={apps.slice(0, 8)} label={row.title} />
    ) : (
      <HorizontalScroller ariaLabel={row.title}>
        {apps.map((app) => (
          <AppCardLink key={app.id} app={app} linkClass="block w-64 shrink-0 snap-start" />
        ))}
      </HorizontalScroller>
    )}
  </section>
));

/**
 * The /apps or /games page body, as a magazine: the app of the day in a
 * large banner, the trending top 10 as a numbered chart, the hand-picked or
 * newest ones as large cards, the recently updated as small tiles, then
 * the section's category rows, one in three as an editorial collection
 * with a sentence on what it holds. Every block reads the same `HOME_ROWS`
 * listings as the homepage (`rows`, undefined while they load); an empty
 * listing is left out unless its row says why it's empty.
 */
export const SectionMagazine = component$<{
  section: HomeSectionId;
  rows?: HomeRows;
  /** The categories the published catalog lists, for `homeRowsOf`. */
  available: ReadonlySet<string>;
}>(({ section, rows, available }) => {
  const sectionRows = homeRowsOf(section, available);
  const trending = sectionRows.find((row) => row.listing.startsWith("trending:"));
  const recent = sectionRows.find((row) => row.listing.startsWith("newApps:"));
  const mustHave = sectionRows.find((row) => row.listing === MUST_HAVE);
  // Apps spotlight the hand-picked must-haves and list the updates as
  // tiles; games have no hand-picked row, so their newest get the large cards.
  const spotlight = mustHave ?? recent;
  const compact = mustHave ? recent : undefined;
  const categories = sectionRows
    .filter((row) => row.category !== undefined)
    .filter((row) => isDrawn(row, rows?.[row.listing]));

  const pool =
    section === "apps"
      ? (rows?.[MUST_HAVE] ?? [])
      : (rows?.[trending?.listing ?? ""] ?? []).slice(0, GAME_OF_THE_DAY_POOL);
  const [featured] = dailyPick(pool, new Date());

  return (
    <div class="flex flex-col gap-14">
      {rows === undefined ? (
        <BlockPlaceholder class="h-80 sm:h-72" />
      ) : (
        featured && <FeaturedApp app={featured} eyebrow={FEATURED[section].eyebrow} />
      )}
      {trending && isDrawn(trending, rows?.[trending.listing]) && (
        <Block
          row={trending}
          apps={rows?.[trending.listing]}
          eyebrow="Top 10"
          kind="ranked"
          placeholder="h-[38rem] md:h-80"
        />
      )}
      {spotlight && isDrawn(spotlight, rows?.[spotlight.listing]) && (
        <Block
          row={spotlight}
          apps={rows?.[spotlight.listing]}
          kind="spotlight"
          placeholder="h-80"
        />
      )}
      {compact && isDrawn(compact, rows?.[compact.listing]) && (
        <Block row={compact} apps={rows?.[compact.listing]} kind="compact" placeholder="h-40" />
      )}
      {categories.map((row, i) =>
        i % 3 === 0 ? (
          <Collection
            key={row.listing}
            level={2}
            title={row.title}
            blurb={categoryBlurb(row.category ?? "", row.title)}
            href={row.href}
            category={row.category}
          >
            {rows === undefined ? (
              <BlockPlaceholder class="h-56" />
            ) : (
              <CompactGrid apps={(rows[row.listing] ?? []).slice(0, 6)} label={row.title} dense />
            )}
          </Collection>
        ) : (
          <Block
            key={row.listing}
            row={row}
            apps={rows?.[row.listing]}
            kind="cards"
            placeholder="h-56"
          />
        ),
      )}
    </div>
  );
});

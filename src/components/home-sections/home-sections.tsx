import { component$, Slot } from "@qwik.dev/core";
import { LuArrowRight, LuGamepad2, LuInfo, LuLayoutGrid, LuPackage } from "@qwikest/icons/lucide";
import { CategoryIcon } from "~/components/category-icon/category-icon";
import { HorizontalScroller } from "~/components/horizontal-scroller/horizontal-scroller";
import { PlatformStack } from "~/components/platform-stack/platform-stack";
import { UnifiedRating } from "~/components/unified-rating/unified-rating";
import type { AppSummary } from "~/catalog-types";

const appHref = (app: AppSummary) => `/app/${encodeURIComponent(app.id)}/`;

/** An app's icon in a rounded square, or a package glyph when it has none. */
export const AppIcon = component$<{ app: AppSummary; size: number; class?: string }>(
  ({ app, size, class: className }) => (
    <span
      class={[
        "rounded-field bg-base-200 flex items-center justify-center overflow-hidden shrink-0",
        className,
      ]}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {app.iconUrl ? (
        <img
          src={app.iconUrl}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          class="w-full h-full object-contain"
        />
      ) : (
        <LuPackage class="text-2xl text-base-content/70" />
      )}
    </span>
  ),
);

/**
 * The icon again, blown up and blurred behind a block: a wash of the app's
 * own colors, since the listings carry icons but not screenshots. Decorative
 * only; a translucent base-color layer on top keeps the text readable.
 */
const IconWash = component$<{ app: AppSummary; strength?: "soft" | "strong" }>(
  ({ app, strength = "soft" }) =>
    app.iconUrl ? (
      <img
        src={app.iconUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        class={[
          "absolute inset-0 w-full h-full object-cover scale-150 blur-3xl saturate-150 pointer-events-none",
          strength === "strong" ? "opacity-70" : "opacity-50",
        ]}
      />
    ) : null,
);

/** An h2 or an h3: blocks sit under a page's h2 sections, or are page sections themselves. */
const Heading = component$<{ level: 2 | 3; class: string }>(({ level, class: className }) =>
  level === 2 ? (
    <h2 class={className}>
      <Slot />
    </h2>
  ) : (
    <h3 class={className}>
      <Slot />
    </h3>
  ),
);

/** A section's heading line: title, an info tip on how it's sorted, and its "see all" link. */
export const SectionHeader = component$<{
  title: string;
  tip?: string;
  href?: string;
  linkLabel?: string;
  eyebrow?: string;
  level?: 2 | 3;
}>(({ title, tip, href, linkLabel = "See all", eyebrow, level = 3 }) => (
  <div class="flex items-end justify-between gap-3 mb-4">
    <div class="min-w-0">
      {eyebrow && (
        <p class="text-xs font-semibold uppercase tracking-wider text-primary mb-0.5">{eyebrow}</p>
      )}
      <div class="flex items-center gap-1.5">
        <Heading level={level} class="text-xl font-bold">
          {title}
        </Heading>
        {tip && (
          <div class="tooltip tooltip-right" data-tip={tip}>
            <LuInfo class="text-sm text-base-content/70 cursor-help" aria-label={tip} />
          </div>
        )}
      </div>
    </div>
    {href && (
      <a href={href} class="link link-primary text-sm shrink-0 inline-flex items-center gap-1">
        {linkLabel} <LuArrowRight aria-hidden="true" />
      </a>
    )}
  </div>
));

/** A block's place while the rows load, at the block's own height. */
export const BlockPlaceholder = component$<{ class: string }>(({ class: className }) => (
  <div
    class={["rounded-box bg-base-200/60 motion-safe:animate-pulse", className]}
    aria-busy="true"
    aria-label="Loading"
  />
));

/**
 * One app, large: its icon washed across the whole banner, the icon itself
 * big, name, description and a call to action. The top of a section.
 */
export const FeaturedApp = component$<{ app: AppSummary; eyebrow: string }>(({ app, eyebrow }) => (
  <a
    href={appHref(app)}
    class="group relative isolate block overflow-hidden rounded-box bg-base-200 border border-base-300"
  >
    <IconWash app={app} strength="strong" />
    <div class="absolute inset-0 bg-gradient-to-r from-base-100/95 via-base-100/80 to-base-100/40" />
    <div class="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 p-6 sm:p-10">
      <AppIcon app={app} size={112} class="rounded-2xl bg-base-100 p-2 shadow-xl" />
      <div class="min-w-0 flex-1">
        <p class="badge badge-primary badge-sm font-semibold mb-2">{eyebrow}</p>
        <h3 class="text-3xl sm:text-4xl font-bold leading-tight">{app.name}</h3>
        <p class="text-sm text-base-content/70 mt-1">{app.category}</p>
        <p class="mt-3 max-w-xl text-base-content/85 line-clamp-3">{app.shortDescription}</p>
        <div class="flex flex-wrap items-center gap-4 mt-5">
          <span class="btn btn-primary btn-sm">
            View app <LuArrowRight aria-hidden="true" />
          </span>
          <PlatformStack sources={app.sources} verifiedSources={app.verifiedSources} />
          {app.rating && (
            <UnifiedRating
              average={app.rating.average}
              count={app.rating.count}
              bySource={app.ratingsBySource}
              mode="short"
            />
          )}
        </div>
      </div>
      {app.iconUrl && (
        <img
          src={app.iconUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
          class="hidden lg:block size-44 object-contain rotate-6 drop-shadow-2xl motion-safe:transition-transform motion-safe:group-hover:rotate-0"
        />
      )}
    </div>
  </a>
));

/**
 * A chart: numbered, compact lines (icon, name, category), in two columns
 * of five on wide screens. An ordered list, so the rank is read out too.
 */
export const RankedList = component$<{ apps: AppSummary[]; label: string; columns?: 1 | 2 }>(
  ({ apps, label, columns = 2 }) => (
    <ol
      aria-label={label}
      class={[
        "grid gap-x-8 gap-y-1",
        columns === 2 && "md:grid-cols-2 md:grid-flow-col md:grid-rows-5",
      ]}
    >
      {apps.map((app, i) => (
        <li key={app.id} class="@container">
          <a
            href={appHref(app)}
            class="flex items-center gap-3 rounded-box px-2 py-2 hover:bg-base-200 transition-colors"
          >
            <span
              aria-hidden="true"
              class="w-7 shrink-0 text-right text-2xl font-black tabular-nums text-primary"
            >
              {i + 1}
            </span>
            <AppIcon app={app} size={48} />
            <span class="min-w-0 flex-1">
              <span class="block font-semibold truncate">{app.name}</span>
              <span class="block text-sm text-base-content/70 truncate">{app.category}</span>
            </span>
            {app.rating && (
              <span class="hidden @sm:inline-flex shrink-0">
                <UnifiedRating
                  average={app.rating.average}
                  count={app.rating.count}
                  bySource={app.ratingsBySource}
                  mode="short"
                />
              </span>
            )}
          </a>
        </li>
      ))}
    </ol>
  ),
);

/** A large card: a band of the icon's colors with the icon on it, then name and three lines of description. */
export const SpotlightCard = component$<{ app: AppSummary }>(({ app }) => (
  <a href={appHref(app)} aria-label={app.name} class="block w-72 sm:w-80 shrink-0 snap-start">
    <article class="card h-full overflow-hidden bg-base-100 border border-base-300 transition-shadow hover:shadow-lg">
      <div class="relative isolate h-28 overflow-hidden bg-base-200 flex items-center justify-center">
        <IconWash app={app} />
        <AppIcon app={app} size={76} class="relative rounded-2xl bg-base-100 p-1.5 shadow-lg" />
      </div>
      <div class="card-body p-5 gap-1">
        <h3 class="text-lg font-semibold line-clamp-1">{app.name}</h3>
        <p class="text-sm text-base-content/70 line-clamp-1">{app.category}</p>
        <p class="text-sm text-base-content/80 line-clamp-3 mt-1">{app.shortDescription}</p>
        <div class="flex flex-wrap items-center gap-3 mt-auto pt-3">
          <PlatformStack sources={app.sources} verifiedSources={app.verifiedSources} />
          {app.rating && (
            <UnifiedRating
              average={app.rating.average}
              count={app.rating.count}
              bySource={app.ratingsBySource}
              mode="short"
            />
          )}
        </div>
      </div>
    </article>
  </a>
));

export const SpotlightRow = component$<{ apps: AppSummary[]; label: string }>(({ apps, label }) => (
  <HorizontalScroller ariaLabel={label}>
    {apps.map((app) => (
      <SpotlightCard key={app.id} app={app} />
    ))}
  </HorizontalScroller>
));

/** Small tiles without descriptions: icon, name, category, several per line. */
export const CompactGrid = component$<{ apps: AppSummary[]; label: string; dense?: boolean }>(
  ({ apps, label, dense }) => (
    <ul
      aria-label={label}
      class={[
        "grid gap-2 grid-cols-1 sm:grid-cols-2",
        dense ? "lg:grid-cols-2" : "lg:grid-cols-3 xl:grid-cols-4",
      ]}
    >
      {apps.map((app) => (
        <li key={app.id}>
          <a
            href={appHref(app)}
            class="flex items-center gap-3 rounded-box p-2.5 bg-base-100 border border-base-300 hover:border-primary/40 hover:shadow-md transition-shadow h-full"
          >
            <AppIcon app={app} size={44} />
            <span class="min-w-0">
              <span class="block font-medium truncate">{app.name}</span>
              <span class="block text-xs text-base-content/70 truncate">{app.category}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  ),
);

/**
 * A category as a boxed shelf: its icon and name, its first apps as short
 * lines with a one-line description, and a "see all" with the count.
 */
export const Shelf = component$<{
  title: string;
  category?: string;
  href?: string;
  count?: number;
  apps?: AppSummary[];
}>(({ title, category, href, count, apps }) => (
  <section class="card bg-base-100 border border-base-300 h-full min-w-0">
    <div class="card-body p-4 gap-3">
      <h3 class="flex items-center gap-2 font-bold text-base">
        {category && (
          <span class="size-8 rounded-field bg-primary/10 text-primary inline-flex items-center justify-center">
            <CategoryIcon category={category} />
          </span>
        )}
        {title}
      </h3>
      {apps === undefined ? (
        <BlockPlaceholder class="h-52" />
      ) : (
        <ul class="flex flex-col gap-1 -mx-1">
          {apps.map((app) => (
            <li key={app.id}>
              <a
                href={appHref(app)}
                class="flex items-center gap-3 rounded-box p-1 hover:bg-base-200 transition-colors"
              >
                <AppIcon app={app} size={40} />
                <span class="min-w-0">
                  <span class="block text-sm font-semibold truncate">{app.name}</span>
                  <span class="block text-xs text-base-content/70 truncate">
                    {app.shortDescription}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {href && (
        <a
          href={href}
          class="link link-primary text-sm mt-auto inline-flex items-center gap-1 self-start"
        >
          {count ? `See all ${count.toLocaleString()}` : "See all"}{" "}
          <LuArrowRight aria-hidden="true" />
        </a>
      )}
    </div>
  </section>
));

/**
 * An editorial collection: a colored panel with a title and a few words on
 * what's in it, next to its apps (the slot).
 */
export const Collection = component$<{
  title: string;
  blurb: string;
  href?: string;
  category?: string;
  eyebrow?: string;
  level?: 2 | 3;
}>(({ title, blurb, href, category, eyebrow = "Collection", level = 3 }) => (
  <section class="grid gap-4 lg:grid-cols-[18rem_1fr] items-stretch">
    <div class="rounded-box p-6 bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10 border border-base-300 flex flex-col gap-3">
      {category && (
        <span class="size-11 rounded-field bg-base-100 text-primary inline-flex items-center justify-center shadow-sm">
          <CategoryIcon category={category} class="text-xl" />
        </span>
      )}
      <p class="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <Heading level={level} class="text-2xl font-bold leading-tight">
        {title}
      </Heading>
      <p class="text-sm text-base-content/80">{blurb}</p>
      {href && (
        <a href={href} class="btn btn-sm btn-outline btn-primary mt-auto self-start">
          Browse all <LuArrowRight aria-hidden="true" />
        </a>
      )}
    </div>
    <div class="min-w-0">
      <Slot />
    </div>
  </section>
));

/**
 * A category as a door: its icon, name and count, and the icons of a few
 * of its most popular apps. The homepage's "Explore" grid.
 */
export const ExploreTile = component$<{
  title: string;
  category: string;
  href: string;
  count?: number;
  /** What the count counts: "apps" or "games". */
  unit: string;
  apps?: AppSummary[];
}>(({ title, category, href, count, unit, apps }) => (
  <a
    href={href}
    class="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4 hover:border-primary/50 hover:shadow-md transition-shadow min-w-0"
  >
    <span class="flex items-center gap-2 min-w-0">
      <span class="size-9 shrink-0 rounded-field bg-primary/10 text-primary inline-flex items-center justify-center">
        <CategoryIcon category={category} class="text-lg" />
      </span>
      <span class="min-w-0">
        <span class="block font-semibold leading-tight truncate">{title}</span>
        {count !== undefined && (
          <span class="block text-xs text-base-content/70 tabular-nums">
            {count.toLocaleString()} {unit}
          </span>
        )}
      </span>
    </span>
    <span class="flex -space-x-2 min-h-9" aria-hidden="true">
      {(apps ?? []).slice(0, 5).map((app) => (
        <AppIcon key={app.id} app={app} size={36} class="ring-2 ring-base-100 bg-base-100 p-0.5" />
      ))}
    </span>
  </a>
));

const DOORS = [
  {
    title: "Explore apps",
    text: "Browsers, creative tools, office, developer tools and more.",
    href: "/apps/",
    gradient: "from-sky-700 to-indigo-800",
    Icon: LuLayoutGrid,
  },
  {
    title: "Explore games",
    text: "Trending games, new releases and every genre.",
    href: "/games/",
    gradient: "from-fuchsia-700 to-rose-700",
    Icon: LuGamepad2,
  },
] as const;

/**
 * Two big doors to /apps and /games, each with a tilted wall of trending
 * icons. White text on dark gradients, the same in both themes.
 */
export const Doors = component$<{ apps?: AppSummary[]; games?: AppSummary[] }>(
  ({ apps, games }) => (
    <div class="grid gap-4 sm:grid-cols-2">
      {DOORS.map((door, i) => (
        <a
          key={door.href}
          href={door.href}
          class={`group relative isolate overflow-hidden rounded-box bg-gradient-to-br ${door.gradient} text-white p-6 min-h-44 flex flex-col justify-end`}
        >
          <ul
            class="absolute -right-4 -top-4 grid grid-cols-4 gap-2 rotate-12 opacity-90 motion-safe:transition-transform motion-safe:group-hover:rotate-6"
            aria-hidden="true"
          >
            {((i === 0 ? apps : games) ?? []).slice(0, 8).map((app) => (
              <li key={app.id}>
                <AppIcon app={app} size={48} class="bg-white/95 p-1 shadow-lg" />
              </li>
            ))}
          </ul>
          <span class="relative">
            <door.Icon class="text-2xl mb-1" aria-hidden="true" />
            <span class="block text-2xl font-extrabold">{door.title} →</span>
            <span class="block text-sm opacity-90 max-w-xs">{door.text}</span>
          </span>
        </a>
      ))}
    </div>
  ),
);

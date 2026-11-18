import { component$ } from "@qwik.dev/core";
import {
  LuArrowRight,
  LuArrowUpRight,
  LuBookOpen,
  LuNewspaper,
  LuUsers,
} from "@qwikest/icons/lucide";
import { LogoChip } from "~/components/logo/logo";
import type { FeatureView } from "~/data/home-features";

const KINDS = {
  creator: { label: "Creator picks", Icon: LuUsers },
  guide: { label: "Guide", Icon: LuBookOpen },
  article: { label: "Article", Icon: LuNewspaper },
} as const;

const linkAttributes = (feature: FeatureView) =>
  feature.external ? { target: "_blank", rel: "noopener" } : {};

/**
 * The featured entry of the moment, large: what it is, a title written to
 * be clicked, a line of teaser and a button, with a creator's app icons
 * fanned out beside it.
 */
export const FeatureCard = component$<{ feature: FeatureView }>(({ feature }) => {
  const kind = KINDS[feature.kind];
  return (
    <a
      href={feature.href}
      {...linkAttributes(feature)}
      class="group relative isolate overflow-hidden rounded-box bg-gradient-to-br from-primary to-secondary text-primary-content p-6 sm:p-8 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] items-center"
    >
      <div class="min-w-0 flex flex-col gap-3">
        <p class="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center gap-1.5">
          <kind.Icon aria-hidden="true" /> {kind.label}
        </p>
        <h2 class="text-3xl sm:text-4xl font-extrabold leading-tight text-balance">
          {feature.title}
        </h2>
        <p class="opacity-90 max-w-md line-clamp-2">{feature.teaser}</p>
        <span class="btn btn-sm bg-base-100 text-base-content border-0 self-start mt-1">
          {feature.action}
          {feature.external ? (
            <LuArrowUpRight aria-label="(opens another site)" />
          ) : (
            <LuArrowRight aria-hidden="true" />
          )}
        </span>
      </div>
      {feature.icons.length > 0 && (
        <ul class="grid grid-cols-6 sm:grid-cols-3 gap-2 sm:gap-3" aria-hidden="true">
          {feature.icons.map((icon, i) => (
            <li
              key={icon.id}
              class={[
                "size-11 sm:size-20 rounded-xl sm:rounded-2xl bg-base-100 p-1 sm:p-2 shadow-xl motion-safe:transition-transform motion-safe:group-hover:rotate-0",
                i % 2 === 0 ? "-rotate-6" : "rotate-6",
              ]}
            >
              <img
                src={icon.iconUrl}
                alt=""
                width={64}
                height={64}
                loading="lazy"
                class="w-full h-full object-contain"
              />
            </li>
          ))}
        </ul>
      )}
      {feature.icons.length === 0 && feature.logos.length > 0 && (
        <span class="hidden sm:flex gap-3" aria-hidden="true">
          {feature.logos.map((slug) => (
            <LogoChip key={slug} slug={slug} />
          ))}
        </span>
      )}
    </a>
  );
});

/** One of the other featured entries, as a short line that goes straight to it. */
export const FeatureLine = component$<{ feature: FeatureView }>(({ feature }) => {
  const kind = KINDS[feature.kind];
  return (
    <li>
      <a
        href={feature.href}
        {...linkAttributes(feature)}
        class="flex items-center gap-3 rounded-box p-3 border border-base-300 bg-base-100 hover:border-primary/50 hover:shadow-md transition-shadow h-full"
      >
        <span class="flex -space-x-2 shrink-0" aria-hidden="true">
          {feature.icons.length > 0
            ? feature.icons
                .slice(0, 3)
                .map((icon) => (
                  <img
                    key={icon.id}
                    src={icon.iconUrl}
                    alt=""
                    width={28}
                    height={28}
                    loading="lazy"
                    class="size-7 rounded-field bg-base-100 ring-2 ring-base-100 object-contain"
                  />
                ))
            : feature.logos
                .slice(0, 3)
                .map((slug) => <LogoChip key={slug} slug={slug} size="sm" />)}
        </span>
        <span class="min-w-0">
          <span class="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <kind.Icon aria-hidden="true" /> {kind.label}
          </span>
          <span class="block font-semibold leading-snug line-clamp-2">
            {feature.title}
            {feature.external && (
              <LuArrowUpRight
                class="inline ml-1 text-base-content/70"
                aria-label="(opens another site)"
              />
            )}
          </span>
        </span>
      </a>
    </li>
  );
});

/** The other featured entries, under a small heading. */
export const FeatureList = component$<{ features: FeatureView[] }>(({ features }) =>
  features.length === 0 ? null : (
    <section aria-labelledby="home-also-featured">
      <h2
        id="home-also-featured"
        class="text-xs font-semibold uppercase tracking-wide text-base-content/70 px-1 mb-2"
      >
        Also featured
      </h2>
      <ul class="flex flex-col gap-2">
        {features.map((feature) => (
          <FeatureLine key={feature.href} feature={feature} />
        ))}
      </ul>
    </section>
  ),
);

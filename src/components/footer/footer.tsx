import { component$ } from "@qwik.dev/core";
import { TuxeryLogo } from "~/components/tuxery-logo/tuxery-logo";
import { DOCS_SECTIONS } from "~/docs-nav";
import { useHeroBackground } from "~/routes/layout";

const CATALOG_LINKS = [
  { href: "/apps/", title: "Apps" },
  { href: "/games/", title: "Games" },
  { href: "/categories/", title: "Categories" },
  { href: "/docs/sources/", title: "Browse by source" },
];

// Every docs page, one column per docs section — the same list as the docs
// sidebar (`DOCS_SECTIONS`), so the two can't drift.
export const Footer = component$(() => {
  const bg = useHeroBackground().value;

  return (
    <footer class="border-t border-base-300 bg-base-200/50 mt-16">
      <div class="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <div class="footer grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-x-6">
          <aside class="col-span-2 md:col-span-4 lg:col-span-2">
            <p class="text-lg font-bold flex items-center gap-2">
              <TuxeryLogo size={22} cutoutColor="var(--color-base-100)" />
              <span>
                Tux<span class="text-tuxery-gradient">ery</span>
              </span>
            </p>
            <p class="text-sm text-base-content/60">
              Never installs anything itself.
              <br />
              Every button leads straight to the real source.
            </p>
            <p class="text-sm text-base-content/60">
              <a href="/docs/license/" class="link link-hover">
                AGPL v3
              </a>
            </p>

            {bg && (
              <p class="text-xs text-base-content/40 mt-3">
                <a href={bg.photoUrl} target="_blank" rel="noopener" class="link link-hover">
                  Background photo
                </a>{" "}
                by{" "}
                <a href={bg.photographerUrl} target="_blank" rel="noopener" class="link link-hover">
                  {bg.photographerName}
                </a>
                <br />
                on{" "}
                <a href={bg.photoUrl} target="_blank" rel="noopener" class="link link-hover">
                  Unsplash
                </a>
                , used under the{" "}
                <a
                  href="https://unsplash.com/license"
                  target="_blank"
                  rel="noopener"
                  class="link link-hover"
                >
                  Unsplash License
                </a>
                .
              </p>
            )}
          </aside>
          <nav aria-label="Catalog">
            <h2 class="footer-title">Catalog</h2>
            {CATALOG_LINKS.map((link) => (
              <a key={link.href} href={link.href} class="link link-hover">
                {link.title}
              </a>
            ))}
          </nav>
          {DOCS_SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h2 class="footer-title">{section.title}</h2>
              {section.pages.map((page) => (
                <a key={page.href} href={page.href} class="link link-hover">
                  {page.title}
                </a>
              ))}
            </nav>
          ))}
        </div>
      </div>
    </footer>
  );
});

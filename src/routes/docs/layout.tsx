import { component$, Slot } from "@qwik.dev/core";
import { useLocation } from "@qwik.dev/router";
import { LuArrowLeft, LuArrowRight, LuChevronDown, LuMenu, LuPencil } from "@qwikest/icons/lucide";
import { adjacentDocsPages, DOCS_SECTIONS, docsEditUrl, findDocsPage } from "~/docs-nav";

/** Every docs page grouped by section, the current one highlighted — rendered twice (desktop sidebar, mobile collapsible), never both visible. */
const DocsNav = component$<{ currentHref: string | undefined }>(({ currentHref }) => (
  <ul class="menu menu-sm w-full p-0">
    {DOCS_SECTIONS.map((section) => (
      <li key={section.title}>
        <h2 class="menu-title">{section.title}</h2>
        <ul>
          {section.pages.map((page) => (
            <li key={page.href}>
              <a
                href={page.href}
                class={page.href === currentHref ? "menu-active" : undefined}
                aria-current={page.href === currentHref ? "page" : undefined}
              >
                {page.title}
              </a>
            </li>
          ))}
        </ul>
      </li>
    ))}
  </ul>
));

/**
 * Shared shell of every `/docs/` page: a sidebar listing them all, the
 * page itself, then prev/next links and — for Markdown pages — a link to
 * edit the source on GitHub. Markdown pages also get `.docs-prose`, the
 * typography a component page writes out with its own classes instead.
 */
export default component$(() => {
  const location = useLocation();
  const page = findDocsPage(location.url.pathname);
  const { prev, next } = adjacentDocsPages(location.url.pathname);
  const editUrl = docsEditUrl(page);

  return (
    <div class="flex flex-col lg:flex-row gap-6 lg:gap-10">
      <details class="group lg:hidden rounded-box bg-base-100 border border-base-300">
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer px-4 py-3 flex items-center gap-2 font-medium">
          <LuMenu />
          Docs{page && <span class="text-base-content/70 font-normal">· {page.title}</span>}
          <LuChevronDown class="ml-auto transition-transform group-open:rotate-180" />
        </summary>
        <nav class="px-2 pb-2" aria-label="Docs menu">
          <DocsNav currentHref={page?.href} />
        </nav>
      </details>

      <aside class="hidden lg:block w-56 shrink-0" aria-label="Docs pages">
        <nav
          class="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto"
          aria-label="Docs sidebar"
        >
          <DocsNav currentHref={page?.href} />
        </nav>
      </aside>

      <div class="min-w-0 flex-1 flex flex-col gap-10">
        <article class={["max-w-3xl", page?.markdown && "docs-prose"]}>
          <Slot />
        </article>

        {(editUrl || prev || next) && (
          <footer class="max-w-3xl flex flex-col gap-4 border-t border-base-300 pt-6">
            {editUrl && (
              <a
                href={editUrl}
                target="_blank"
                rel="noopener"
                class="link link-hover text-sm text-base-content/70 inline-flex items-center gap-1.5 self-start"
              >
                <LuPencil class="text-xs" />
                Edit this page on GitHub
              </a>
            )}
            <div class="grid grid-cols-2 gap-3">
              {prev ? (
                <a
                  href={prev.href}
                  class="btn btn-ghost h-auto py-2 justify-start text-left flex-col items-start gap-0"
                >
                  <span class="text-xs text-base-content/70 inline-flex items-center gap-1">
                    <LuArrowLeft class="text-xs" /> Previous
                  </span>
                  <span>{prev.title}</span>
                </a>
              ) : (
                <span />
              )}
              {next && (
                <a
                  href={next.href}
                  class="btn btn-ghost h-auto py-2 justify-end text-right flex-col items-end gap-0"
                >
                  <span class="text-xs text-base-content/70 inline-flex items-center gap-1">
                    Next <LuArrowRight class="text-xs" />
                  </span>
                  <span>{next.title}</span>
                </a>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
});

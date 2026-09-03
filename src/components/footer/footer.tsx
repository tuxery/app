import { component$ } from "@builder.io/qwik";
import { TuxeryLogo } from "~/components/tuxery-logo/tuxery-logo";
import { useHeroBackground } from "~/routes/layout";

export const Footer = component$(() => {
  const bg = useHeroBackground().value;

  return (
    <footer class="border-t border-base-300 bg-base-200/50 mt-16">
      <div class="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <div class="footer sm:footer-horizontal">
          <aside>
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
              <a href="/license/" class="link link-hover">
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
          <nav>
            <h6 class="footer-title">Catalog</h6>
            <a href="/apps/" class="link link-hover">
              Apps
            </a>
            <a href="/games/" class="link link-hover">
              Games
            </a>
            <a href="/categories/" class="link link-hover">
              Categories
            </a>
            <a href="/distros/" class="link link-hover">
              Browse by source
            </a>
          </nav>
          <nav>
            <h6 class="footer-title">Project</h6>
            <a href="/about/" class="link link-hover">
              About
            </a>
            <a href="/status/" class="link link-hover">
              Status
            </a>
            <a href="/contribute/" class="link link-hover">
              How to contribute
            </a>
            <a href="/sources/" class="link link-hover">
              Source credits
            </a>
          </nav>
          <nav>
            <h6 class="footer-title">Legal</h6>
            <a href="/license/" class="link link-hover">
              License
            </a>
            <a href="/licenses/" class="link link-hover">
              Third-party licenses
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
});

import { component$ } from "@builder.io/qwik";
import { useHeroBackground } from "~/routes/layout";

export const Footer = component$(() => {
  const bg = useHeroBackground().value;

  return (
    <footer class="border-t border-base-300 bg-base-200/50 mt-16">
      <div class="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <div class="footer sm:footer-horizontal">
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
            <a href="/utils/" class="link link-hover">
              Utils
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

        <div class="divider" />

        <div class="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-base-content/60">
          <p>
            🐧 Tux<span class="text-primary">ery</span> — never installs anything itself, every
            button hands off to the real source.
          </p>
          <p>AGPL-3.0-or-later</p>
        </div>

        {bg && (
          <p class="text-xs text-base-content/40 mt-3">
            Background photo by{" "}
            <a href={bg.photographerUrl} target="_blank" rel="noopener" class="link link-hover">
              {bg.photographerName}
            </a>{" "}
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
      </div>
    </footer>
  );
});

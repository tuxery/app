import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="flex flex-col gap-10 max-w-2xl">
      <section>
        <h1 class="text-3xl font-bold mb-3">License</h1>
        <p class="text-base-content/80">
          Tuxery is licensed under the{" "}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            class="link link-primary"
            target="_blank"
            rel="noopener"
          >
            GNU Affero General Public License v3.0 or later
          </a>{" "}
          (AGPL-3.0-or-later) — a strong copyleft license, and specifically the one built to close
          the "SaaS loophole" that plain GPL leaves open: modify GPL code and run it as a web
          service without ever handing anyone a binary, and GPL alone never requires you to share
          the source. AGPL closes that.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-3">What that means, depending on who you are</h2>
        <div class="flex flex-col gap-4">
          <div>
            <h3 class="font-medium mb-1">Individuals</h3>
            <ul class="list-disc list-inside text-base-content/80 flex flex-col gap-1">
              <li>Use, read, and study the code freely.</li>
              <li>
                Modify it for your own use — no obligation to share anything you never distribute.
              </li>
              <li>Share a modified copy with someone — the source has to come with it.</li>
            </ul>
          </div>
          <div>
            <h3 class="font-medium mb-1">Non-profits and communities</h3>
            <ul class="list-disc list-inside text-base-content/80 flex flex-col gap-1">
              <li>Run your own instance, fork it for your community, adapt it freely.</li>
              <li>
                If people use your modified version over a network (a hosted instance, not just your
                own machine), you have to offer them its source.
              </li>
            </ul>
          </div>
          <div>
            <h3 class="font-medium mb-1">Companies</h3>
            <ul class="list-disc list-inside text-base-content/80 flex flex-col gap-1">
              <li>Commercial use is allowed.</li>
              <li>
                The network clause still applies: run a modified version as a service — even
                internally, even without a traditional "release" — and AGPL requires offering the
                source to anyone who interacts with it over the network.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-3">Obligations</h2>
        <div class="overflow-x-auto border border-base-300 rounded-box">
          <table class="table">
            <tbody>
              <tr>
                <td class="font-medium whitespace-nowrap">Keep notices</td>
                <td class="text-base-content/70">
                  Copyright and license notices stay intact in anything you redistribute.
                </td>
              </tr>
              <tr>
                <td class="font-medium whitespace-nowrap">Disclose source for network use</td>
                <td class="text-base-content/70">
                  Running a modified version as a network service counts — offer its source to
                  users, not just people you hand a copy to directly.
                </td>
              </tr>
              <tr>
                <td class="font-medium whitespace-nowrap">State your changes</td>
                <td class="text-base-content/70">Mark what you modified, and when.</td>
              </tr>
              <tr>
                <td class="font-medium whitespace-nowrap">Same license</td>
                <td class="text-base-content/70">
                  Modified or combined works stay under AGPL-3.0-or-later — no relicensing under
                  something more permissive or proprietary.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="border border-primary/30 bg-primary/5 rounded-box p-4">
        <p class="text-base-content/80">
          <span class="font-medium">The one thing worth remembering:</span> fork Tuxery and run it
          as a service other people can reach — even privately, even without ever shipping a binary
          — and AGPL requires making that version's source available to them. That's the whole point
          of choosing AGPL over plain GPL for a web app.
        </p>
      </section>

      <section>
        <p class="text-sm text-base-content/60">
          This page is a plain-language summary for convenience, not legal advice — the license text
          in each repository is what actually governs. Full text:{" "}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            class="link link-primary"
            target="_blank"
            rel="noopener"
          >
            gnu.org/licenses/agpl-3.0
          </a>
          , or the{" "}
          <a
            href="https://github.com/tuxery/app/blob/main/LICENSE"
            class="link link-primary"
            target="_blank"
            rel="noopener"
          >
            LICENSE file
          </a>{" "}
          in this repository.
        </p>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "License — Tuxery",
  meta: [
    {
      name: "description",
      content: "What AGPL-3.0-or-later means for Tuxery, in plain language, by audience.",
    },
  ],
};

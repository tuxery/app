import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

interface Dependency {
  name: string;
  license: string;
  url: string;
}

// Hand-maintained for now — checked against each package's real
// package.json `license` field at time of writing. Should eventually be
// generated at build time (e.g. a license-checker-style tool reading the
// lockfile) rather than kept in sync by hand, since dependencies change
// often enough that a manual list will drift.
const DEPENDENCIES: Dependency[] = [
  { name: "Qwik", license: "MIT", url: "https://github.com/QwikDev/qwik" },
  { name: "Qwik City", license: "MIT", url: "https://github.com/QwikDev/qwik" },
  {
    name: "@libsql/client",
    license: "MIT",
    url: "https://github.com/tursodatabase/libsql-client-ts",
  },
  { name: "@qwik-ui/headless", license: "MIT", url: "https://github.com/qwikifiers/qwik-ui" },
  { name: "@qwikest/icons", license: "MIT", url: "https://github.com/qwikest/icons" },
  { name: "daisyUI", license: "MIT", url: "https://github.com/saadeghi/daisyui" },
  { name: "Tailwind CSS", license: "MIT", url: "https://github.com/tailwindlabs/tailwindcss" },
  { name: "Vite", license: "MIT", url: "https://github.com/vitejs/vite" },
];

export default component$(() => {
  return (
    <div class="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 class="text-3xl font-bold mb-2">Third-party licenses</h1>
        <p class="text-base-content/70">
          Every third-party library actually shipped in this site's bundle, and its license.
          Tuxery's own catalog pipeline has its own build-time-only dependencies that never reach
          your browser, so they aren't listed here — see the{" "}
          <a href="/license/" class="link link-primary">
            License
          </a>{" "}
          page for Tuxery's own.
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Package</th>
              <th>License</th>
            </tr>
          </thead>
          <tbody>
            {DEPENDENCIES.map((dep) => (
              <tr key={dep.name}>
                <td>
                  <a href={dep.url} target="_blank" rel="noopener" class="link link-primary">
                    {dep.name}
                  </a>
                </td>
                <td>{dep.license}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Third-party licenses — Tuxery",
  meta: [
    {
      name: "description",
      content: "Third-party open source libraries used to build Tuxery, and their licenses.",
    },
  ],
};

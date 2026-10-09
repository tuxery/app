// Regenerates src/data/third-party-licenses.json — the docs' third-party
// licenses page (/docs/licenses/) — from the direct dependencies of this
// repo and of tuxery/catalog, each one's license and version read from
// its installed package.json. Run after a dependency change, in either
// repo, with both installed side by side (the devcontainer layout):
//
//   pnpm sync:licenses [path/to/catalog]
//
// and commit the JSON. Direct dependencies only — their own dependencies
// are listed by each package's license file, not here.

import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const APP_DIR = resolve(import.meta.dirname, "..");
const CATALOG_DIR = resolve(process.argv[2] ?? join(APP_DIR, "..", "catalog"));
const OUTPUT = join(APP_DIR, "src/data/third-party-licenses.json");

// devDependencies of this repo that still end up in the site's bundle
// (the framework itself and the CSS it compiles to) — everything else
// listed as a devDependency only runs on a developer's machine or in CI.
const SHIPPED_DEV_DEPENDENCIES = new Set(["@qwik.dev/core", "@qwik.dev/router", "tailwindcss"]);

interface Manifest {
  version?: string;
  license?: string | { type?: string };
  homepage?: string;
  repository?: string | { url?: string };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface Package {
  name: string;
  version: string;
  license: string;
  url: string;
}

async function readManifest(path: string): Promise<Manifest> {
  return JSON.parse(await readFile(path, "utf8")) as Manifest;
}

function repositoryUrl(manifest: Manifest, name: string): string {
  const raw =
    typeof manifest.repository === "string" ? manifest.repository : manifest.repository?.url;
  if (raw) {
    const url = raw
      .replace(/^git\+/, "")
      .replace(/^git:\/\//, "https://")
      .replace(/^github:/, "https://github.com/")
      .replace(/\.git$/, "");
    if (url.startsWith("https://")) return url;
    if (/^[\w.-]+\/[\w.-]+$/.test(url)) return `https://github.com/${url}`;
  }
  return manifest.homepage ?? `https://www.npmjs.com/package/${name}`;
}

async function describe(root: string, names: string[]): Promise<Package[]> {
  const packages = await Promise.all(
    names.map(async (name) => {
      const manifest = await readManifest(join(root, "node_modules", name, "package.json"));
      const license =
        typeof manifest.license === "string" ? manifest.license : (manifest.license?.type ?? "");
      return {
        name,
        version: manifest.version ?? "",
        license: license || "See its repository",
        url: repositoryUrl(manifest, name),
      };
    }),
  );
  return packages.toSorted((a, b) => a.name.localeCompare(b.name));
}

const app = await readManifest(join(APP_DIR, "package.json"));
const catalog = await readManifest(join(CATALOG_DIR, "package.json"));
const appDev = Object.keys(app.devDependencies ?? {});

const groups = [
  {
    id: "website",
    title: "Website",
    description: "Shipped to your browser or run by the server that renders these pages.",
    packages: await describe(APP_DIR, [
      ...Object.keys(app.dependencies ?? {}),
      ...appDev.filter((name) => SHIPPED_DEV_DEPENDENCIES.has(name)),
    ]),
  },
  {
    id: "pipeline",
    title: "Data pipeline",
    description:
      "Run by tuxery/catalog to fetch, merge and publish the data — never sent to your browser.",
    packages: await describe(CATALOG_DIR, Object.keys(catalog.dependencies ?? {})),
  },
  {
    id: "tooling",
    title: "Development tooling",
    description:
      "Used to build, check and test both repos, on developers' machines and in CI only.",
    packages: (
      await Promise.all([
        describe(
          APP_DIR,
          appDev.filter((name) => !SHIPPED_DEV_DEPENDENCIES.has(name)),
        ),
        describe(CATALOG_DIR, Object.keys(catalog.devDependencies ?? {})),
      ])
    )
      .flat()
      // Both repos share tools (TypeScript, oxlint, vitest...): list each once.
      .filter((pkg, index, all) => all.findIndex((other) => other.name === pkg.name) === index)
      .toSorted((a, b) => a.name.localeCompare(b.name)),
  },
];

await writeFile(OUTPUT, `${JSON.stringify({ groups }, null, 2)}\n`);
console.log(
  groups.map((group) => `${group.title}: ${group.packages.length}`).join(", "),
  `→ ${OUTPUT}`,
);

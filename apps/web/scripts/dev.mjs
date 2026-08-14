#!/usr/bin/env node
// `pnpm dev` — plain Vite SSR, no data, no worker (today's exact
// behavior). `pnpm dev --sample` — full worker + local R2 simulation,
// seeded with catalog's committed ~1k-app sample (see dev-worker.mjs's
// DEFAULT_DATASET). For the full production dataset, use `catalog`'s
// `pnpm dev` instead, which calls dev-worker.mjs directly with a
// freshly-built dataset.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const useSample = process.argv.includes("--sample");

const result = useSample
  ? spawnSync("node", [fileURLToPath(new URL("dev-worker.mjs", import.meta.url))], {
      stdio: "inherit",
    })
  : spawnSync("vite", ["--mode", "ssr"], { stdio: "inherit" });

process.exit(result.status ?? 1);

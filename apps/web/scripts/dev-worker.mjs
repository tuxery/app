#!/usr/bin/env node
// Seeds the local wrangler R2 simulation with a dataset.json, builds the
// Cloudflare Pages Worker, then launches `wrangler pages dev`. Used by
// both `pnpm dev --sample` (this repo, default dataset) and `catalog`'s
// `pnpm dev`/`pnpm dev --force` (invokes this file directly, cross-repo,
// via `node <absolute path> --dataset=...`) — the one place this logic
// lives, replacing the old dev.cf + seed.r2 pair.
//
// Deliberately self-contained: cross-repo callers invoke this with a
// bare `node <path>`, not through a pnpm script, so neither PATH (no
// node_modules/.bin) nor cwd (whatever the caller's cwd was) can be
// relied on — every spawned command below sets cwd explicitly and goes
// through `pnpm exec` to resolve local binaries regardless of caller.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const APP_WEB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Committed in `catalog` (same repo as the `pnpm --filter @tuxery/pipeline
// sample` command that generates it), not here — fixed sibling path, same
// convention as catalog's dev.ts reaching into this repo.
const DEFAULT_DATASET = "/workspaces/catalog/packages/pipeline/dev-sample/dataset.json";

function flagValue(name) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg?.slice(name.length + 3);
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", cwd: APP_WEB_DIR });
  if (result.error) console.error(result.error);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const datasetPath = resolve(flagValue("dataset") ?? DEFAULT_DATASET);

run("pnpm", [
  "exec",
  "wrangler",
  "r2",
  "object",
  "put",
  "tuxery-catalog/dataset.json",
  `--file=${datasetPath}`,
  "--local",
]);
run("pnpm", ["build.server"]);
run("pnpm", ["exec", "wrangler", "pages", "dev", "dist", "--port", "8788"]);

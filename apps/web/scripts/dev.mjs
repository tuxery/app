#!/usr/bin/env node
// Builds the Cloudflare Pages Worker and launches `wrangler pages dev`,
// prod-like: real Worker, real Turso HTTP client. Pure client, always —
// this repo never starts any database infrastructure itself, only ever
// connects to a URL. Two modes:
//   - default (local): connects to the local `turso dev` server that
//     catalog's `pnpm serve` runs in front of its locally-seeded database
//     file (`pnpm seed` there first). Unlimited reads/writes, no network.
//   - --remote: connects to the real hosted Turso dev DB instead — real
//     network latency, real quotas, closer to how prod actually behaves.
// Either way, catalog.ts only ever speaks the libsql HTTP protocol — this
// script just decides which URL it points at, written into .dev.vars
// (gitignored, regenerated on every run — not meant to be hand-edited,
// see .dev.vars.example for the shape it takes).
//
// For fast UI-only iteration with no worker/DB at all, use `pnpm start`
// (plain Vite SSR) instead.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const LOCAL_DB_URL = "http://127.0.0.1:8080";

// Shared credentials for the real hosted Turso dev DB, used by --remote.
// One file, read by both repos (catalog/scripts/seed.ts parses the same
// file) so there's a single place to update rather than two drifting
// copies. Not committed — real credentials, per-developer.
const SHARED_ENV_PATH = "/workspaces/.dev/.env";
const DEV_VARS_PATH = fileURLToPath(new URL("../.dev.vars", import.meta.url));

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function readSharedEnv() {
  const content = readFileSync(SHARED_ENV_PATH, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

async function isReachable(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(500) });
    return true;
  } catch {
    return false;
  }
}

const remote = process.argv.includes("--remote");

if (remote) {
  const env = readSharedEnv();
  if (!env.TURSO_DB_URL) {
    console.error(`--remote requires TURSO_DB_URL in ${SHARED_ENV_PATH}`);
    process.exit(1);
  }
  writeFileSync(
    DEV_VARS_PATH,
    `TURSO_DB_URL=${env.TURSO_DB_URL}\nTURSO_DB_AUTH_TOKEN=${env.TURSO_DB_AUTH_TOKEN ?? ""}\n`,
  );
  console.log(`Remote mode: pointing at ${env.TURSO_DB_URL}`);
} else {
  if (!(await isReachable(LOCAL_DB_URL))) {
    console.error(
      `No local Turso server reachable at ${LOCAL_DB_URL} — in catalog, run \`pnpm seed\` ` +
        "(if you haven't) then `pnpm serve` (this repo never starts that server itself).",
    );
    process.exit(1);
  }
  writeFileSync(DEV_VARS_PATH, `TURSO_DB_URL=${LOCAL_DB_URL}\nTURSO_DB_AUTH_TOKEN=\n`);
  console.log(`Local mode: connecting to ${LOCAL_DB_URL}`);
}

// Both steps, in order — `build.server` alone (skipping the plain client
// build) leaves the client manifest incomplete for QRLs only reachable via
// client-side interactivity (e.g. `useVisibleTask$`), which then fail to
// resolve at runtime (Qwik error Code(31), reproduced and confirmed by
// running each step manually before adding this comment).
run("pnpm", ["build.client"]);
run("pnpm", ["build.server"]);
run("pnpm", ["exec", "wrangler", "pages", "dev", "dist", "--port", "8788"]);

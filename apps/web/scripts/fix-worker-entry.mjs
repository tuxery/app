import { readFileSync, writeFileSync } from "node:fs";

// @builder.io/qwik-city's cloudflare-pages adapter writes `_worker.js` with
// a bare `"entry.cloudflare-pages"` import (via node:path's `relative()`,
// which never adds a leading `./`). Bare specifiers resolve as package
// imports, not relative files, so esbuild (used by `wrangler pages dev`
// and Cloudflare's own deploy build) can't find it. Rewrite it to a real
// relative import after each server build.
const path = "dist/_worker.js";
const content = readFileSync(path, "utf8");
const fixed = content.replace('"entry.cloudflare-pages"', '"./entry.cloudflare-pages"');

if (fixed === content) {
  throw new Error(
    `${path} did not contain the expected bare import — adapter output may have changed.`,
  );
}

writeFileSync(path, fixed);

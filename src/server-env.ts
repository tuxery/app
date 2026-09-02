// Server-only, same split as `~/catalog`/`~/unsplash` — must only ever be
// referenced inside a routeLoader$/RequestHandler `$` callback.
//
// `process.env` alone doesn't work on the deployed Cloudflare Worker: the
// Cloudflare Workers build target has no real Node `process`, so the build
// tooling stubs `process.env` as a dead, empty object baked into the
// bundle — completely disconnected from whatever secrets are bound to the
// Worker at runtime (verified live: `wrangler secret put` had zero effect
// on `process.env.TURSO_DB_URL` in the deployed bundle). Cloudflare's real
// bindings only ever reach the app through `requestEvent.platform.env`, so
// that's the source of truth here — `process.env` is kept only as the
// fallback for `pnpm dev`/`pnpm start`, which run plain Node/Vite and have
// no `platform.env` at all.
export type ServerEnv = Record<string, string | undefined>;

export function resolveServerEnv(platform: QwikCityPlatform | undefined): ServerEnv {
  return { ...process.env, ...(platform?.env as ServerEnv | undefined) };
}

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
// Keyed off the generated `Env` (see `worker-configuration.d.ts`/`pnpm
// cf-typegen`) rather than a bare `Record<string, string>` — a renamed or
// removed binding then fails to typecheck here instead of silently
// resolving to `undefined` at runtime, same failure mode this file exists
// to prevent in the first place. `Partial` because `Env`'s fields are
// generated as required `string`s (from local `.dev.vars`, which is
// trusted to be complete), but the real Worker's `platform.env` and
// `pnpm dev`/`pnpm start`'s `process.env` both make no such guarantee.
export type ServerEnv = Partial<
  Pick<Env, "TURSO_DB_URL" | "TURSO_DB_AUTH_TOKEN" | "UNSPLASH_ACCESS_KEY">
>;

export function resolveServerEnv(platform: QwikCityPlatform | undefined): ServerEnv {
  return { ...process.env, ...(platform?.env as ServerEnv | undefined) };
}

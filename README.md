# Tuxery — `app`

The Tuxery product: a search-first Qwik UI. The data behind it — source
connectors (Flatpak/Flathub, Snap/Snapcraft, AppImage, native), the matching
engine, and the persisted dataset — lives in
[`tuxery/catalog`](https://github.com/tuxery/catalog), a separate repo so
contributors can work on a connector without touching Qwik. See
[`init.md`](https://github.com/tuxery/.github) and the
[Tuxery GitHub Project](https://github.com/orgs/tuxery/projects/1) for the
product brief and roadmap.

## Layout

One Qwik City app at the repo root — no `apps/*`/`packages/*` nesting,
there's only ever been one deployable here.

```text
app/
├── public/       # static assets
└── src/
    ├── components/
    └── routes/    # search homepage, app detail, about, settings
```

## Development

```shell
pnpm install
pnpm dev            # Vite SSR dev server on :5173
```

Queries `tuxery/catalog`'s dataset — always against catalog's own **local**
`turso dev` server (`http://127.0.0.1:8080`), never a hosted Turso DB; see
`vite.config.ts`'s own comment for why that's a hard rule, not just a
default. Run `tuxery/catalog`'s `pnpm seed` then `pnpm serve` first (its own
README) to have real data locally; without that, the homepage just shows an
empty catalog rather than failing.

## Checks

```shell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Deployment

Two Workers, both named environments in the same `wrangler.jsonc`, deployed by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) (not
Cloudflare's own Git integration — its dashboard doesn't expose a
per-branch deploy command on this account, so GitHub Actions owns it
instead, via `cloudflare/wrangler-action` and a `CLOUDFLARE_API_TOKEN` repo
secret):

- **`tuxery-web`** (`env.production`) — on `tuxery.store` and
  `www.tuxery.store` (identical), deployed with `wrangler deploy --env
production` on every push to `main`.
- **`tuxery-web-preview`** (`env.preview`) — no custom domain, but each
  branch gets its own stable, non-clobbering [Aliased Preview
  URL](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/#aliased-preview-urls)
  (`<branch>-tuxery-web-preview.<subdomain>.workers.dev`) via `wrangler
versions upload --env preview --preview-alias <branch>` on every pull
  request targeting `main` — `versions upload`, not `deploy`, is the point:
  it never touches the environment's 100%-traffic version, so two PRs open
  at once no longer overwrite each other's preview.

Both read `TURSO_DB_URL`/`TURSO_DB_AUTH_TOKEN`/`UNSPLASH_ACCESS_KEY` as Worker
secrets, set per environment — `wrangler secret put <NAME> --env production`
for `tuxery-web`, `wrangler versions secret put <NAME> --env preview` for
`tuxery-web-preview` (a plain `secret put` fails there: preview never has a
100%-traffic deployed version to attach to, by design — see above; every
later `versions upload` picks up a `versions secret put` change without
needing one). `scripts/push-cloudflare-secrets.sh` does both, from
`../.dev/.env.prod` and `../.dev/.env.preview` respectively — never
committed, never plain `vars` (those get wiped by Wrangler on every deploy
unless declared in this file, so secrets are the only thing that reliably
survives dashboard-side). `tuxery-web-preview`'s secrets point at its own
`preview-tuxery` Turso DB, not prod's — there is no shared "dev" Turso DB
(retired 2026-09-03); local dev emulates a local sqlite instead (see
`vite.config.ts`, and "Development" above).

**Not** `process.env`, despite `nodejs_compat` being enabled: the Cloudflare
Workers build target has no real Node `process`, so Vite bakes `process.env`
into a dead, empty object at build time, completely disconnected from
whatever's bound to the Worker at runtime — confirmed live (2026-09-02) by
inspecting the deployed bundle after `wrangler secret put` had zero effect
on it. `requestEvent.platform.env` is the one channel the bundler doesn't
touch, so `~/server-env`'s `resolveServerEnv()` reads from there, falling
back to `process.env` only for `pnpm dev`/`pnpm start` (plain Vite/Node,
no `platform` at all). Every `routeLoader$`/`server$` that needs a secret
must thread `resolveServerEnv(requestEvent.platform)` (or `this.platform`
in a `server$`) into `~/catalog`/`~/unsplash` explicitly — there is no
ambient fallback that quietly does this for you.

Build locally with `pnpm build.server`, deploy with `pnpm deploy`, or
preview with `pnpm serve` (reads `.dev.vars`, gitignored — copy the three
keys above from `../.dev/.env.preview`, or run `pnpm cf-typegen` after
creating it to keep `worker-configuration.d.ts`'s `Env` type in sync).

## Status

`apps/web`'s homepage renders live, server-side search results against
`tuxery/catalog`'s dataset (substring match on name/description, via a
Turso database). That dataset itself is still mostly stubs beyond the
core fields (name, description, packages) — richer per-app fields
(screenshots, ratings, reviews...) are tracked as cards on the
[Tuxery GitHub Project](https://github.com/orgs/tuxery/projects/1), not
in this file.

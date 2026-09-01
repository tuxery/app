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

Queries `tuxery/catalog`'s dataset via Turso — run `tuxery/catalog`'s
`pnpm seed` then `pnpm serve` first (its own README) to have real data
locally; without that, the homepage just shows an empty catalog rather
than failing.

## Checks

```shell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Deployment

Cloudflare Workers, on `tuxery.store` and `www.tuxery.store` (identical).
`wrangler.jsonc` defines the Worker (assets binding, custom domains); build
locally with `pnpm build.server`, deploy with `pnpm deploy`, or preview with
`pnpm serve`. `TURSO_DB_URL`, `TURSO_DB_AUTH_TOKEN`, `UNSPLASH_ACCESS_KEY` are
Worker secrets, never committed — `process.env` picks them up automatically
via `nodejs_compat`. In production, Cloudflare's own Git integration (Workers
Builds) builds and deploys straight from `main` on every merge; secrets are
configured there, in the Cloudflare dashboard.

## Status

`apps/web`'s homepage renders live, server-side search results against
`tuxery/catalog`'s dataset (substring match on name/description, via a
Turso database). That dataset itself is still mostly stubs beyond the
core fields (name, description, packages) — richer per-app fields
(screenshots, ratings, reviews...) are tracked as cards on the
[Tuxery GitHub Project](https://github.com/orgs/tuxery/projects/1), not
in this file.

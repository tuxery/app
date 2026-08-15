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

```text
app/
└── apps/
    └── web/            # Qwik City UI (search, filters, unified app cards)
```

## Development

```shell
pnpm install
pnpm dev            # local mode: builds + wrangler pages dev on :8788, connects to catalog's local server
pnpm dev --remote   # remote mode: same, but queries the real hosted Turso dev DB
pnpm start          # fast Vite SSR on :5173 (apps/web), no worker, no data
```

**Local (default)** is a pure client — it never starts any database
infrastructure itself. It connects to a libSQL server that
`tuxery/catalog` runs (`pnpm seed` then `pnpm serve` there, in two of
their own terminals) — unlimited reads/writes, no network. Without that
server running, `pnpm dev` here refuses to start rather than silently
serving an empty catalog.

**Remote** (`--remote`) points the Worker at the real hosted Turso dev DB
instead — no local server needed, `tuxery/catalog`'s `pnpm seed --remote`
publishes straight there. Real network latency, real quotas, closer to
how prod behaves. Credentials come from `/workspaces/.dev/.env` (shared
with `tuxery/catalog`'s side), not from anything committed in this repo.

## Checks

```shell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Or scoped to `apps/web`: `pnpm --filter web dev`, `pnpm --filter web test`, etc.

## Deploy

`apps/web` builds via the Cloudflare Pages adapter
(`apps/web/adapters/cloudflare-pages/`). `.github/workflows/deploy.yml`
builds and runs `wrangler pages deploy` on push to `main`, but only once the
`CLOUDFLARE_API_TOKEN` secret and `CLOUDFLARE_ACCOUNT_ID` repo variable are
configured in this repository's settings — until then the job is a no-op.

## Status

`apps/web`'s homepage renders live, server-side search results against
`tuxery/catalog`'s dataset (substring match on name/description, via a
Turso database — see `src/catalog.ts` and `src/routes/api/search/`).
`tuxery/catalog`'s dataset itself is still mostly stubs beyond the core
fields (name, description, packages) — richer per-app fields (screenshots,
ratings, reviews...) are tracked as cards on the
[Tuxery GitHub Project](https://github.com/orgs/tuxery/projects/1), not in
this file.

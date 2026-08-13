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
pnpm dev            # Qwik dev server on :5173 (apps/web)
```

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

`apps/web`'s homepage currently renders a placeholder catalog, not live
search results — it isn't wired to `tuxery/catalog`'s dataset yet, and that
dataset itself is still mostly stubs. Real source integration, the matching
algorithm, and live search are tracked as cards on the
[Tuxery GitHub Project](https://github.com/orgs/tuxery/projects/1), not in
this file.

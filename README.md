# Tuxery — `app`

The Tuxery product: a search-first Qwik UI, a package matching/deduplication
engine, and connectors to Flatpak (Flathub), Snap (Snapcraft), AppImage and
native package sources. See [`init.md`](https://github.com/tuxery/.github)
and the [Tuxery GitHub Project](https://github.com/orgs/tuxery/projects/1)
for the product brief and roadmap.

pnpm workspace monorepo — kept as one repo rather than split like some other
orgs' multi-repo setups, since cross-repo TypeScript/pnpm dependencies are
much more friction than e.g. Rust/Cargo git dependencies. `packages/matcher`
and `packages/sources` are still separate packages so they stay easy to
extract into a standalone public-API service later.

## Layout

```text
app/
├── apps/
│   └── web/            # Qwik City UI (search, filters, unified app cards)
├── packages/
│   ├── matcher/         # @tuxery/matcher — scoring/dedup engine
│   └── sources/         # @tuxery/sources — Flathub/Snapcraft/AppImage connectors
├── tsconfig.base.json    # shared TS config for packages/*
└── pnpm-workspace.yaml
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

Or scoped to one package: `pnpm --filter web dev`, `pnpm --filter @tuxery/matcher test`, etc.

## Deploy

`apps/web` builds via the Cloudflare Pages adapter
(`apps/web/adapters/cloudflare-pages/`). `.github/workflows/deploy.yml`
builds and runs `wrangler pages deploy` on push to `main`, but only once the
`CLOUDFLARE_API_TOKEN` secret and `CLOUDFLARE_ACCOUNT_ID` repo variable are
configured in this repository's settings — until then the job is a no-op.

## Status

`apps/web`'s homepage currently renders a placeholder catalog, not live
search results — `packages/sources`' connectors are stubs that return no
results yet, and the homepage isn't wired to `packages/matcher`/`sources` at
all yet. Real source integration, the matching algorithm, and live search
are tracked as cards on the
[Tuxery GitHub Project](https://github.com/orgs/tuxery/projects/1), not in
this file.

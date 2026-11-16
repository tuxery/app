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

One Qwik (Qwik Router) app at the repo root — no `apps/*`/`packages/*` nesting,
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
README) to have real data locally; without that, pages that need the
catalog answer 503 with a "catalog unavailable" banner (the docs and
settings still work).

## Checks

```shell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Deployment

One Worker, `tuxery-web`, deployed by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) (not
Cloudflare's own Git integration — its dashboard doesn't expose a
per-branch deploy command on this account, so GitHub Actions owns it
instead, via `cloudflare/wrangler-action` and a `CLOUDFLARE_API_TOKEN` repo
secret):

- **Production** — on `tuxery.store` (`www.tuxery.store` redirects there),
  deployed with `wrangler deploy` on every push to `main`.
- **[Worker Previews](https://developers.cloudflare.com/workers/previews/)**
  — every pull request targeting `main` gets its own Preview at
  `pr-<n>.preview.tuxery.store` (`wrangler preview --name pr-<n>`), deleted
  when the pull request closes. Previews never touch production's traffic,
  and two PRs open at once don't overwrite each other's. They're served
  with `X-Robots-Tag: noindex` (`~/seo`'s `isPreviewHost`). This replaced
  the separate `tuxery-web-preview` Worker on 2026-10-19.

Both read `TURSO_DB_URL`/`TURSO_DB_AUTH_TOKEN`/`UNSPLASH_ACCESS_KEY` as Worker
secrets, set separately — `wrangler secret put <NAME>` for production,
`wrangler preview base-config secret put <NAME>` for Previews (the Previews
Base config every new Preview starts from; Previews never inherit
production's secrets, vars or bindings — the other settings they need are in
`wrangler.jsonc`'s `previews` block). `scripts/push-cloudflare-secrets.sh`
does both, from the `PROD_TURSO_*` and `PREVIEW_TURSO_*` values OpenBao puts in
the devcontainer's environment (`kv/orgs/tuxery`, see `openbao-env status`) —
never committed, never plain `vars` (those get wiped by Wrangler on every
deploy unless declared in this file, so secrets are the only thing that
reliably survives dashboard-side). The Previews' secrets point at the
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
preview with `pnpm serve` (reads `.dev.vars`, gitignored — point
`TURSO_DB_URL` at catalog's local `turso dev` server, e.g.
`http://localhost:8080` with `pnpm seed`/`pnpm serve` running there, same
as plain `pnpm dev` defaults to; use the `PREVIEW_TURSO_*` values from
OpenBao if you specifically need real preview data, or run
`pnpm cf-typegen` after creating it to keep `worker-configuration.d.ts`'s
`Env` type in sync).

## Search engines and the public launch

The site is in a private beta: nothing may be indexed yet. One constant
decides it, `SITE_IS_PUBLIC` in [`src/seo.ts`](src/seo.ts). While it is
`false`:

- every page answers with `X-Robots-Tag: noindex` and a
  `<meta name="robots" content="noindex">`;
- every static file gets the same header from the `_headers` file the build
  writes ([`src/static-files.ts`](src/static-files.ts), along with
  robots.txt: neither lives in `public/`);
- robots.txt doesn't name the sitemap, and production answers 404 for
  `/sitemap.xml` and its parts, so no crawler is handed ~100k pages to
  render that it may not index. Previews and local servers serve them, so
  they can be checked before the launch (`/sitemap.xml` on any PR
  Preview).

Pull-request Previews stay `noindex` whatever the switch says.

What is ready either way: canonical URLs, Open Graph and X card tags on
every page (the app's icon on app pages, `public/og-image.jpg` elsewhere),
a `SoftwareApplication` JSON-LD on app pages
([`src/structured-data.ts`](src/structured-data.ts)), the 404 and error
pages (`src/routes/404.tsx`, `src/routes/error.tsx`), and the sitemap: an
index at `/sitemap.xml`, the site's pages in `/sitemaps/pages.xml`, every
app page in parts of at most 10,000 per category (`src/sitemap.ts`), read
from the per-category id lists catalog precomputes (~300 rows read for the
whole set, kept a day at the edge).

On launch day:

1. Set `SITE_IS_PUBLIC = true` in `src/seo.ts`, merge, and let the deploy
   finish.
2. Check production: `curl -sI https://tuxery.store/` has no
   `X-Robots-Tag`, `https://tuxery.store/robots.txt` ends with
   `Sitemap: https://tuxery.store/sitemap.xml`, and that URL answers 200.
3. Submit `https://tuxery.store/sitemap.xml` in
   [Google Search Console](https://search.google.com/search-console)
   (Domain property for `tuxery.store`, verified with a DNS TXT record in
   Cloudflare) and in
   [Bing Webmaster Tools](https://www.bing.com/webmasters) (it can import
   the Search Console property). Bing's submission also reaches the other
   engines that use its index.
4. Check the app pages' structured data with Google's
   [Rich Results Test](https://search.google.com/test/rich-results) on one
   page (it reports the JSON-LD as read, without a rich result: see
   `src/structured-data.ts` for why there's no price or rating in it).

## Status

The app renders live, server-side pages from `tuxery/catalog`'s dataset in
a Turso database; free-text search on /browse goes through catalog's
`apps_fts` index (FTS5 trigram over id, name and short description, so
words of at least 3 characters). That dataset itself is still mostly stubs beyond the
core fields (name, description, packages) — richer per-app fields
(screenshots, ratings, reviews...) are tracked as cards on the
[Tuxery GitHub Project](https://github.com/orgs/tuxery/projects/1), not
in this file.

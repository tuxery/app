# AGENTS.md — Tuxery `app`

The Tuxery product monorepo: Qwik UI, matching engine, source connectors.

## Language

**All content must be in English** — code, comments, doc-comments, commit
messages, issues, pull requests, and configuration. No exceptions.

## Scope

- `apps/web` — Qwik City UI. No product logic beyond rendering/routing; keep
  matching/scoring in `packages/matcher` and network/source access in
  `packages/sources`.
- `packages/matcher` — package deduplication/scoring engine. Pure functions,
  no I/O.
- `packages/sources` — normalized `SourcedPackage` type and async connectors
  per upstream source (Flathub, Snapcraft, AppImage, native).

## Rules

- Don't add a local `TODO.md`/`ROADMAP.md` — track work as cards on the
  [Tuxery GitHub Project](https://github.com/orgs/tuxery/projects/1) instead
  (per this org's bootstrap instructions).
- Keep `packages/matcher` and `packages/sources` free of Qwik/UI dependencies
  — they're meant to be reusable if/when a standalone public API is split
  out later.
- Don't wire real upstream network calls into `packages/sources`' connectors
  as a side effect of unrelated work — that's its own tracked card
  (per-source rate limits, caching, and error handling all need deliberate
  design, not an incidental implementation).

## Commit conventions

Canonical rules live in [`tuxery/.dev`'s AGENTS.md](https://github.com/tuxery/.dev/blob/main/AGENTS.md)
and [`commit-convention.json`](https://github.com/tuxery/.dev/blob/main/commit-convention.json).
Format: `type(scope): <emoji> description`.

### Allowed scopes

Scopes live in [`scopes.json`](./scopes.json) at this repo's root:

| Scope     | Maps to                                       |
| --------- | --------------------------------------------- |
| `web`     | `apps/web`                                    |
| `matcher` | `packages/matcher`                            |
| `sources` | `packages/sources`                            |
| `ui`      | Cross-cutting UI/design changes in `apps/web` |
| `ci`      | `.github/workflows/`                          |
| `deps`    | Dependency bumps                              |

**Do not use a scope outside this list.** If a new top-level concern is
added, update `scopes.json` (and this table) together.

```text
feat(matcher): ✨ add Levenshtein-based name scoring
feat(sources): ✨ wire up the real Flathub search API
feat(web): ✨ render live search results on the homepage
chore(deps): 📌 pin qwik to 1.20.0
```

## Git workflow

Short-lived feature branches, merged via PR into `main`. No release-train
model yet (see `tuxery/.dev`'s AGENTS.md) — this is an early-stage, mostly
solo project; adopt stricter branch protection when it actually ships to
users or gains collaborators, not preemptively.

## License

AGPL-3.0-or-later.

# AGENTS.md — Tuxery `app`

The Tuxery product: Qwik UI. The data pipeline (source connectors, matching
engine, rebuild scripts, persisted store) lives in
[`tuxery/catalog`](https://github.com/tuxery/catalog).

## Language

**All content must be in English** — code, comments, doc-comments, commit
messages, issues, pull requests, and configuration. No exceptions.

## Scope

- `apps/web` — Qwik City UI. No product logic beyond rendering/routing; it
  queries `tuxery/catalog`'s dataset via Turso (see `src/catalog.ts`), not
  reimplement matching/scoring locally.

## Rules

- Don't add a local `TODO.md`/`ROADMAP.md` — track work as cards on the
  [Tuxery GitHub Project](https://github.com/orgs/tuxery/projects/1) instead
  (per this org's bootstrap instructions).

## Commit conventions

Canonical rules live in [`tuxery/.dev`'s AGENTS.md](https://github.com/tuxery/.dev/blob/main/AGENTS.md)
and [`commit-convention.json`](https://github.com/tuxery/.dev/blob/main/commit-convention.json).
Format: `type(scope): <emoji> description`.

### Allowed scopes

Scopes live in [`scopes.json`](./scopes.json) at this repo's root:

| Scope  | Maps to                                       |
| ------ | --------------------------------------------- |
| `web`  | `apps/web`                                    |
| `ui`   | Cross-cutting UI/design changes in `apps/web` |
| `ci`   | `.github/workflows/`                          |
| `deps` | Dependency bumps                              |

**Do not use a scope outside this list.** If a new top-level concern is
added, update `scopes.json` (and this table) together.

```text
feat(web): ✨ render live search results on the homepage
chore(deps): 📌 pin qwik to 1.20.0
```

## Git workflow

Push straight to `main`, no PR needed — this is an early-stage PoC, mostly
solo project. No release-train model yet (see `tuxery/.dev`'s AGENTS.md).
Adopt feature branches + PRs and stricter branch protection once it actually
ships to users or gains collaborators, not preemptively.

## License

AGPL-3.0-or-later.

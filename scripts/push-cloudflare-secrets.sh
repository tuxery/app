#!/usr/bin/env bash
# Pushes tuxery-web's secrets to Cloudflare, for production and for its
# pull-request Previews (TURSO_DB_URL, TURSO_DB_AUTH_TOKEN,
# UNSPLASH_ACCESS_KEY — see README.md's "Deployment" section and
# wrangler.jsonc):
#   production <- ../.dev/.env.prod    (prod-tuxery DB)
#   previews   <- ../.dev/.env.preview (preview-tuxery DB — there is no
#                 shared "dev" Turso DB anymore, retired 2026-09-03; local
#                 dev emulates a local sqlite instead, see vite.config.ts)
# Auth always comes from .env.prod's CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID
# (same Cloudflare account for both), so no `wrangler login` is needed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
DEV_DIR="$(cd "$APP_DIR/../.dev" && pwd)"

# shellcheck disable=SC1091
CLOUDFLARE_API_TOKEN="$(source "$DEV_DIR/.env.prod" && echo "$CLOUDFLARE_API_TOKEN")"
# shellcheck disable=SC1091
CLOUDFLARE_ACCOUNT_ID="$(source "$DEV_DIR/.env.prod" && echo "$CLOUDFLARE_ACCOUNT_ID")"

if [[ -z "$CLOUDFLARE_API_TOKEN" || -z "$CLOUDFLARE_ACCOUNT_ID" ]]; then
  echo "Missing CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID in $DEV_DIR/.env.prod" >&2
  exit 1
fi
export CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID

push_env() {
  local target="$1" env_file="$2"

  if [[ ! -f "$env_file" ]]; then
    echo "Missing $env_file" >&2
    exit 1
  fi

  # Isolated subshell so each env's vars never leak into the other's.
  (
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a

    for var in TURSO_DB_URL TURSO_DB_AUTH_TOKEN UNSPLASH_ACCESS_KEY; do
      if [[ -z "${!var:-}" ]]; then
        echo "Missing $var in $env_file" >&2
        exit 1
      fi
    done

    cd "$APP_DIR"
    # Previews don't share production's secrets: theirs live in the Previews
    # Base config, which every later `wrangler preview` starts from.
    local put_command="secret put"
    if [[ "$target" == "previews" ]]; then
      put_command="preview base-config secret put"
    fi
    for secret in TURSO_DB_URL TURSO_DB_AUTH_TOKEN UNSPLASH_ACCESS_KEY; do
      echo "==> Setting $secret ($target)"
      # shellcheck disable=SC2086
      printf '%s' "${!secret}" | pnpm exec wrangler $put_command "$secret"
    done
  )
}

push_env production "$DEV_DIR/.env.prod"
push_env previews "$DEV_DIR/.env.preview"

echo "Done."

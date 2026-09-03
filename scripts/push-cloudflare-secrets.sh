#!/usr/bin/env bash
# Pushes Worker secrets to Cloudflare for both environments
# (TURSO_DB_URL, TURSO_DB_AUTH_TOKEN, UNSPLASH_ACCESS_KEY — see README.md's
# "Environment Variables" section and wrangler.jsonc):
#   production <- ../.dev/.env.prod (tuxery DB)
#   preview    <- ../.dev/.env      (tuxery-dev DB)
# Auth always comes from .env.prod's CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID
# (same Cloudflare account for both envs), so no `wrangler login` is needed.
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
  local wrangler_env="$1" env_file="$2"

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
    # preview never has a plain 100%-traffic deployed version to attach a
    # classic `secret put` to — deploy.yml uses `versions upload
    # --preview-alias` there on purpose (see README.md's Deployment
    # section), so every version only ever exists behind its own alias
    # URL. `versions secret put` updates the environment's stored secret
    # without needing one; every later `versions upload` picks it up.
    # production still gets a real `wrangler deploy` (100% traffic) each
    # time, so the classic command keeps working there.
    local put_command="secret put"
    if [[ "$wrangler_env" == "preview" ]]; then
      put_command="versions secret put"
    fi
    for secret in TURSO_DB_URL TURSO_DB_AUTH_TOKEN UNSPLASH_ACCESS_KEY; do
      echo "==> Setting $secret --env $wrangler_env"
      # shellcheck disable=SC2086
      printf '%s' "${!secret}" | pnpm exec wrangler $put_command "$secret" --env "$wrangler_env"
    done
  )
}

push_env production "$DEV_DIR/.env.prod"
push_env preview "$DEV_DIR/.env"

echo "Done."

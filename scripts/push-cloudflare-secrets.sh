#!/usr/bin/env bash
# Pushes tuxery-web's secrets to Cloudflare, for production and for its
# pull-request Previews (see README.md's "Deployment" section and
# wrangler.jsonc). Every value comes from the environment: in the
# devcontainer, openbao-env loads them from OpenBao (kv/orgs/tuxery, see
# `openbao-env status`), under the same names as the GitHub Actions secrets:
#   production <- PROD_TURSO_DB_URL, PROD_TURSO_DB_AUTH_TOKEN (prod-tuxery DB),
#                 UNSPLASH_ACCESS_KEY, FEEDBACK_GITHUB_TOKEN (optional),
#                 TURNSTILE_SECRET_KEY (optional)
#   previews   <- PREVIEW_TURSO_DB_URL, PREVIEW_TURSO_DB_AUTH_TOKEN
#                 (preview-tuxery DB), UNSPLASH_ACCESS_KEY
# Cloudflare auth: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID, the same
# account for both, so no `wrangler login` is needed.
#
#   scripts/push-cloudflare-secrets.sh [production|previews]   (default: both)
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

require() {
  local missing=()
  for var in "$@"; do [[ -n "${!var:-}" ]] || missing+=("$var"); done
  if ((${#missing[@]})); then
    echo "Missing in the environment: ${missing[*]} (OpenBao kv/orgs/tuxery, see openbao-env status)" >&2
    exit 1
  fi
}

require CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
export CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID

# put <target> <secret name> <variable holding its value>
put() {
  local target="$1" name="$2" var="$3"
  # Previews don't share production's secrets: theirs live in the Previews
  # Base config, which every later `wrangler preview` starts from.
  local command=(secret put)
  [[ "$target" == "previews" ]] && command=(preview base-config secret put)
  echo "==> Setting $name ($target)"
  printf '%s' "${!var}" | pnpm exec wrangler "${command[@]}" "$name"
}

push_production() {
  require PROD_TURSO_DB_URL PROD_TURSO_DB_AUTH_TOKEN UNSPLASH_ACCESS_KEY
  put production TURSO_DB_URL PROD_TURSO_DB_URL
  put production TURSO_DB_AUTH_TOKEN PROD_TURSO_DB_AUTH_TOKEN
  put production UNSPLASH_ACCESS_KEY UNSPLASH_ACCESS_KEY
  # Optional, production only: /feedback's token (see src/feedback.ts).
  # Previews never get it, so their form can't file test issues.
  if [[ -n "${FEEDBACK_GITHUB_TOKEN:-}" ]]; then
    put production FEEDBACK_GITHUB_TOKEN FEEDBACK_GITHUB_TOKEN
  fi
  # Optional, production only: /feedback's Turnstile secret (see
  # src/turnstile.ts); its site key is a public var in wrangler.jsonc.
  if [[ -n "${TURNSTILE_SECRET_KEY:-}" ]]; then
    put production TURNSTILE_SECRET_KEY TURNSTILE_SECRET_KEY
  fi
}

push_previews() {
  require PREVIEW_TURSO_DB_URL PREVIEW_TURSO_DB_AUTH_TOKEN UNSPLASH_ACCESS_KEY
  put previews TURSO_DB_URL PREVIEW_TURSO_DB_URL
  put previews TURSO_DB_AUTH_TOKEN PREVIEW_TURSO_DB_AUTH_TOKEN
  put previews UNSPLASH_ACCESS_KEY UNSPLASH_ACCESS_KEY
}

case "${1:-both}" in
  production) push_production ;;
  previews) push_previews ;;
  both)
    push_production
    push_previews
    ;;
  *)
    echo "Usage: $0 [production|previews]" >&2
    exit 2
    ;;
esac

echo "Done."

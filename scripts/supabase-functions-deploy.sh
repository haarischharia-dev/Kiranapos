#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${EXPO_PUBLIC_SUPABASE_URL:-}" ]]; then
  echo "❌ Missing EXPO_PUBLIC_SUPABASE_URL in .env"
  exit 1
fi

PROJECT_REF="${EXPO_PUBLIC_SUPABASE_URL#https://}"
PROJECT_REF="${PROJECT_REF%%.supabase.co}"

mkdir -p supabase/.temp
printf '%s' "$PROJECT_REF" > supabase/.temp/project-ref

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  cat <<EOF
❌ Missing SUPABASE_ACCESS_TOKEN — required for edge function deploy.

1. Open https://supabase.com/dashboard/account/tokens
2. Generate a new access token
3. Add to .env:

   SUPABASE_ACCESS_TOKEN=sbp_your_token_here

4. Run:

   npm run functions:deploy

Alternative (one-time): npx supabase login
EOF
  exit 1
fi

FUNCTION="${1:-v1-sync}"
export SUPABASE_ACCESS_TOKEN

echo "→ Deploying edge function '${FUNCTION}' to ${PROJECT_REF}..."
npx supabase functions deploy "$FUNCTION" \
  --project-ref "$PROJECT_REF" \
  --use-api \
  "${@:2}"

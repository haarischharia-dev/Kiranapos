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

encode_password() {
  node -e "console.log(encodeURIComponent(process.argv[1]))" "$1"
}

build_pooler_url() {
  local region="${SUPABASE_DB_REGION:-}"
  local password="${SUPABASE_DB_PASSWORD:-}"

  if [[ -z "$region" || -z "$password" ]]; then
    return 1
  fi

  local encoded
  encoded="$(encode_password "$password")"
  printf 'postgresql://postgres.%s:%s@aws-0-%s.pooler.supabase.com:5432/postgres' \
    "$PROJECT_REF" "$encoded" "$region"
}

push_migrations() {
  npx supabase db push --yes --db-url "$1" "${@:2}"
}

if [[ -n "${SUPABASE_DB_URL:-}" ]]; then
  echo "→ Pushing migrations to ${PROJECT_REF} (session pooler)..."
  push_migrations "$SUPABASE_DB_URL" "$@"
  exit 0
fi

if DB_URL="$(build_pooler_url)"; then
  echo "→ Pushing migrations to ${PROJECT_REF} (aws-0-${SUPABASE_DB_REGION})..."
  push_migrations "$DB_URL" "$@"
  exit 0
fi

cat <<EOF
❌ Cannot push migrations — database credentials missing.

Add ONE of these to your .env file:

Option A (recommended): Session pooler URI from Supabase Dashboard
  Connect → Session pooler → URI (port 5432)

  SUPABASE_DB_URL=postgresql://postgres.${PROJECT_REF}:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres

Option B: Database password + AWS region
  Project Settings → Database → Database password
  Project Settings → General → Region (e.g. ap-south-1)

  SUPABASE_DB_PASSWORD=your-database-password
  SUPABASE_DB_REGION=ap-south-1

Then run:

  npm run db:push

Note: \`npx supabase db push\` alone also requires \`npx supabase login\` first.
This script uses --db-url and skips CLI login when SUPABASE_DB_URL is set.
EOF
exit 1

#!/usr/bin/env bash
set -euo pipefail
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not set. Export it first." >&2
  exit 1
fi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
psql "$DATABASE_URL" -f "$SCRIPT_DIR/../server/postgres-payouts.sql"

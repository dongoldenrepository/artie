#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Artie – Run a migration against all registered artists
#
# Usage:
#   ./migrate-all.sh migrations/0011_new_feature.sql
#
# Prerequisites:
#   - artists.json exists (copy from artists.json.template and fill in)
#   - wrangler installed and authenticated to each artist's account
#     OR you have a CLOUDFLARE_API_TOKEN with access to all accounts
# ─────────────────────────────────────────────────────────────

set -e

MIGRATION_FILE=$1

if [ -z "$MIGRATION_FILE" ]; then
  echo "Usage: ./migrate-all.sh <migration_file>"
  echo "Example: ./migrate-all.sh migrations/0011_new_feature.sql"
  exit 1
fi

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

if [ ! -f "artists.json" ]; then
  echo "❌ artists.json not found. Copy artists.json.template and fill in your values."
  exit 1
fi

echo ""
echo "🎨 Artie – Running migration: $MIGRATION_FILE"
echo "─────────────────────────────────────────────────────────────"

# Parse artists.json and run migration for each
ARTISTS=$(node -e "
  const artists = require('./artists.json');
  artists.forEach(a => console.log(a.slug + '|' + a.d1_database_name + '|' + a.cloudflare_account_id));
")

SUCCESS=0
FAILED=0

while IFS='|' read -r SLUG DB_NAME ACCOUNT_ID; do
  echo ""
  echo "→ $SLUG ($DB_NAME)..."
  if CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID" wrangler d1 execute "$DB_NAME" --file="$MIGRATION_FILE"; then
    echo "  ✅ Done"
    ((SUCCESS++))
  else
    echo "  ❌ FAILED for $SLUG — check output above"
    ((FAILED++))
  fi
done <<< "$ARTISTS"

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "Complete: $SUCCESS succeeded, $FAILED failed"
echo ""

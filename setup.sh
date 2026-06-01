#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Artie – New Artist Setup Script
# Run this once to provision a new artist's Cloudflare resources
# and deploy their catalog.
#
# Prerequisites:
#   - Node.js installed
#   - Wrangler installed: npm install -g wrangler
#   - Artist must be logged in to their Cloudflare account: wrangler login
# ─────────────────────────────────────────────────────────────

set -e

echo ""
echo "🎨 Welcome to Artie Setup"
echo "─────────────────────────────────────────────────────────────"
echo ""

# ── Gather info ──────────────────────────────────────────────
read -p "Artist short name (lowercase, no spaces, e.g. 'kathy'): " ARTIST_SLUG
read -p "Artist display name (e.g. 'Kathy Golden Fine Art'): " ARTIST_NAME
read -p "GitHub repo URL (https://github.com/YOUR_ORG/artie): " GITHUB_REPO

DB_NAME="artie-${ARTIST_SLUG}-db"
BUCKET_NAME="artie-${ARTIST_SLUG}-images"
PROJECT_NAME="artie-${ARTIST_SLUG}"

echo ""
echo "Setting up: $ARTIST_NAME"
echo "  Cloudflare Pages project : $PROJECT_NAME"
echo "  D1 database              : $DB_NAME"
echo "  R2 bucket                : $BUCKET_NAME"
echo ""
read -p "Looks good? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "Aborted."
  exit 1
fi

# ── Install dependencies ─────────────────────────────────────
echo ""
echo "Installing dependencies..."
npm install

# ── Create D1 database ───────────────────────────────────────
echo ""
echo "Creating D1 database: $DB_NAME"
DB_OUTPUT=$(wrangler d1 create "$DB_NAME" 2>&1)
echo "$DB_OUTPUT"
DB_ID=$(echo "$DB_OUTPUT" | grep "database_id" | awk '{print $3}' | tr -d '"')

if [ -z "$DB_ID" ]; then
  echo "❌ Could not extract database ID. Please check the output above."
  exit 1
fi
echo "✅ D1 database created: $DB_ID"

# ── Create R2 bucket ─────────────────────────────────────────
echo ""
echo "Creating R2 bucket: $BUCKET_NAME"
wrangler r2 bucket create "$BUCKET_NAME"
echo "✅ R2 bucket created"

# ── Generate wrangler.toml ───────────────────────────────────
echo ""
echo "Generating wrangler.toml..."
cat > wrangler.toml <<EOF
name = "${PROJECT_NAME}"
compatibility_date = "2024-09-23"
pages_build_output_dir = "dist"

[vars]
ARTIST_NAME = "${ARTIST_NAME}"

[[d1_databases]]
binding = "DB"
database_name = "${DB_NAME}"
database_id = "${DB_ID}"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "${BUCKET_NAME}"
EOF
echo "✅ wrangler.toml created"

# ── Run migrations ───────────────────────────────────────────
echo ""
echo "Running database migrations..."
for f in migrations/*.sql; do
  echo "  Applying $f..."
  wrangler d1 execute "$DB_NAME" --file="$f"
done
echo "✅ Migrations complete"

# ── Build and deploy ─────────────────────────────────────────
echo ""
echo "Building and deploying to Cloudflare Pages..."
npm run build
wrangler pages deploy dist --project-name="$PROJECT_NAME"
echo "✅ Deployed"

# ── Connect to GitHub for auto-updates ───────────────────────
echo ""
echo "─────────────────────────────────────────────────────────────"
echo "✅ Setup complete!"
echo ""
echo "IMPORTANT – Final step (manual):"
echo "  1. Go to https://dash.cloudflare.com → Pages → $PROJECT_NAME"
echo "  2. Click 'Settings' → 'Builds & deployments'"
echo "  3. Connect to GitHub repo: $GITHUB_REPO"
echo "  4. Set branch to: main"
echo "  5. Build command: npm run build"
echo "  6. Build output directory: dist"
echo ""
echo "Once connected, every push to 'main' will auto-deploy to $ARTIST_NAME's catalog."
echo ""

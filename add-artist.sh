#!/usr/bin/env bash
# ============================================================
# add-artist.sh  —  Onboard a new Artie artist
#
# Usage:
#   ./add-artist.sh "Jane Doe" painter
#   ./add-artist.sh "Bob Smith" photographer
#
# What it does:
#   1. Creates a Cloudflare D1 database  (artie-firstname-last-db)
#   2. Creates a Cloudflare R2 bucket    (artie-firstname-last-images)
#   3. Generates wrangler-firstname.toml
#   4. Runs all schema migrations against the new DB
#   5. Inserts the artist record (name, type, subdomain)
#
# After this script:
#   - Create the Cloudflare Pages project in the dashboard
#     (name it artie-firstname-last, connect to dongoldenrepository/artie)
#   - Set ADMIN_PASSWORD and MASTER_PASSWORD secrets in the Pages dashboard
# ============================================================

set -e

# ── Args ─────────────────────────────────────────────────────
FULL_NAME="${1:-}"
ARTIST_TYPE="${2:-painter}"   # painter | photographer

if [[ -z "$FULL_NAME" ]]; then
  echo "Usage: ./add-artist.sh \"First Last\" [painter|photographer]"
  exit 1
fi

# ── Derive slugs from name ────────────────────────────────────
# Slug uses first word + last word only, lowercased, hyphens stripped
# "Eugenia Algaze Garcia" → artie-eugenia-garcia
# "Mary-Jane Doe"         → artie-maryjane-doe
FIRST=$(echo "$FULL_NAME" | awk '{print $1}' | tr '[:upper:]' '[:lower:]' | tr -d '-')
LAST=$(echo "$FULL_NAME"  | awk '{print $NF}' | tr '[:upper:]' '[:lower:]' | tr -d '-')

SLUG="artie-${FIRST}-${LAST}"          # e.g. artie-eugenia-garcia
DB_NAME="${SLUG}-db"                   # e.g. artie-eugenia-garcia-db
BUCKET_NAME="${SLUG}-images"           # e.g. artie-eugenia-garcia-images
SUBDOMAIN="${SLUG}"                    # e.g. artie-eugenia-garcia
TOML_FILE="wrangler-${FIRST}.toml"    # e.g. wrangler-eugenia.toml

echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│  Adding artist: $FULL_NAME"
echo "│  Type:          $ARTIST_TYPE"
echo "│  Slug:          $SLUG"
echo "│  DB:            $DB_NAME"
echo "│  Bucket:        $BUCKET_NAME"
echo "│  Config:        $TOML_FILE"
echo "└─────────────────────────────────────────────┘"
echo ""
read -p "Proceed? (y/N) " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

# ── 1. Create D1 database ─────────────────────────────────────
echo ""
echo "▶ Creating D1 database: $DB_NAME ..."
DB_OUTPUT=$(npx wrangler d1 create "$DB_NAME" 2>&1)
echo "$DB_OUTPUT"

# Extract database_id from output
DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | head -1 | sed 's/database_id = "//;s/"//')
if [[ -z "$DB_ID" ]]; then
  # Try alternate format
  DB_ID=$(echo "$DB_OUTPUT" | grep -o '"[0-9a-f-]\{36\}"' | head -1 | tr -d '"')
fi

if [[ -z "$DB_ID" ]]; then
  echo ""
  echo "⚠  Could not auto-detect database_id from wrangler output."
  echo "   Check the output above and paste the database_id here:"
  read -p "   database_id: " DB_ID
fi

echo "   database_id: $DB_ID"

# ── 2. Create R2 bucket ───────────────────────────────────────
echo ""
echo "▶ Creating R2 bucket: $BUCKET_NAME ..."
npx wrangler r2 bucket create "$BUCKET_NAME" || echo "   (bucket may already exist — continuing)"

# ── 3. Generate wrangler toml ─────────────────────────────────
echo ""
echo "▶ Writing $TOML_FILE ..."
cat > "$TOML_FILE" <<EOF
name = "$SLUG"
compatibility_date = "2024-09-23"
pages_build_output_dir = "dist"

[vars]
ARTIST_NAME = "$FULL_NAME"

[[d1_databases]]
binding = "DB"
database_name = "$DB_NAME"
database_id = "$DB_ID"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "$BUCKET_NAME"
EOF
echo "   Written."

# ── 4. Run schema migrations ──────────────────────────────────
# Skip data-only migrations that belong to Don's initial import.
SKIP="0002_bulk_import.sql|0004_bulk_image_keys.sql|0014_don_photograph_type.sql"

echo ""
echo "▶ Running migrations against $DB_NAME ..."
for f in migrations/*.sql; do
  filename=$(basename "$f")
  if echo "$filename" | grep -qE "^($SKIP)$"; then
    echo "   SKIP  $filename  (data migration, Don-specific)"
    continue
  fi
  echo "   RUN   $filename"
  npx wrangler d1 execute "$DB_NAME" \
    --file="$f" \
    --config="$TOML_FILE" \
    --remote \
    --yes 2>&1 | grep -E "Executed|ERROR|error" || true
done

# ── 5. Insert artist record ───────────────────────────────────
echo ""
echo "▶ Inserting artist record ..."
SEED_SQL="INSERT OR IGNORE INTO artists (id, name, artist_type, subdomain) VALUES (1, '${FULL_NAME//\'/\'\'}', '$ARTIST_TYPE', '$SUBDOMAIN');"

npx wrangler d1 execute "$DB_NAME" \
  --command="$SEED_SQL" \
  --config="$TOML_FILE" \
  --remote \
  --yes 2>&1 | grep -E "Executed|ERROR|error" || true

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "✅ Done! Next steps:"
echo ""
echo "   1. In the Cloudflare dashboard, create a Pages project:"
echo "      - Name:       $SLUG"
echo "      - Repo:       dongoldenrepository/artie  (branch: main)"
echo ""
echo "   2. In Pages → Settings → Variables and Secrets, add:"
echo "      - ARTIST_NAME    = $FULL_NAME   (plaintext)"
echo "      - ADMIN_PASSWORD = <initial password>  (secret)"
echo "      - MASTER_PASSWORD = <your master password>  (secret)"
echo ""
echo "   3. Share the site URL with the artist:"
echo "      https://<pages.dev domain assigned by Cloudflare>"
echo ""
echo "   The artist will be prompted to set their own password on first login."
echo ""

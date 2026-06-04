#!/bin/bash
# Upload Don's images from artist-catalog/catalog-images-v2 to artie-don-images R2 bucket
set -e

SRC_DIR="../artist-catalog/catalog-images-v2"
BUCKET="artie-don-images"

cd "$(dirname "$0")"

if [ ! -d "$SRC_DIR" ]; then
  echo "❌ Source directory not found: $SRC_DIR"
  exit 1
fi

TOTAL=$(ls "$SRC_DIR"/*.jpg 2>/dev/null | wc -l | tr -d ' ')
echo "Uploading $TOTAL images to $BUCKET..."
echo ""

COUNT=0
for f in "$SRC_DIR"/*.jpg; do
  FILENAME=$(basename "$f")
  COUNT=$((COUNT + 1))
  echo "[$COUNT/$TOTAL] $FILENAME"
  npx wrangler r2 object put "$BUCKET/$FILENAME" \
    --file="$f" \
    --content-type=image/jpeg \
    --remote \
    --config=wrangler-don.toml
done

echo ""
echo "✅ Done! $COUNT images uploaded to $BUCKET."

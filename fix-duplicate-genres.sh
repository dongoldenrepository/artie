#!/bin/bash
# Fix duplicate genres caused by seed being run twice.
# Keeps the lowest-ID row for each (artist_id, name, tag_type) combination.
# Run from the artie/ directory.

set -e
cd "$(dirname "$0")"

DEDUP_SQL="DELETE FROM genres WHERE id NOT IN (SELECT MIN(id) FROM genres GROUP BY artist_id, name, tag_type);"
CHECK_SQL="SELECT tag_type, COUNT(*) as total, COUNT(DISTINCT name) as unique_names FROM genres GROUP BY tag_type ORDER BY tag_type;"

echo "=== artie-don-golden-db ==="
node_modules/.bin/wrangler d1 execute artie-don-golden-db --remote --config wrangler-don.toml --command "$DEDUP_SQL"
node_modules/.bin/wrangler d1 execute artie-don-golden-db --remote --config wrangler-don.toml --command "$CHECK_SQL"

echo ""
echo "=== artie-kathy-golden-db ==="
node_modules/.bin/wrangler d1 execute artie-kathy-golden-db --remote --config wrangler-kathy.toml --command "$DEDUP_SQL"
node_modules/.bin/wrangler d1 execute artie-kathy-golden-db --remote --config wrangler-kathy.toml --command "$CHECK_SQL"

echo ""
echo "=== artie-mary-lynch-db ==="
node_modules/.bin/wrangler d1 execute artie-mary-lynch-db --remote --config wrangler-mary.toml --command "$DEDUP_SQL"
node_modules/.bin/wrangler d1 execute artie-mary-lynch-db --remote --config wrangler-mary.toml --command "$CHECK_SQL"

echo ""
echo "Done. All genre duplicates removed."

#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Migrate Don's data from artist-catalog-db to artie-don-db
# ─────────────────────────────────────────────────────────────

set -e

SRC="artist-catalog-db"
DST="artie-don-db"

echo "Exporting artworks from $SRC..."
npx wrangler d1 execute $SRC --remote --json --command="
SELECT id, title, medium, size, price, date_created, current_location,
       description, image_key, is_available, sort_order, created_at,
       updated_at, artwork_type
FROM artworks ORDER BY id;
" > /tmp/don_artworks.json

echo "Exporting genres from $SRC..."
npx wrangler d1 execute $SRC --remote --json --command="
SELECT id, name, color, 'subject' as tag_type, 1 as enabled FROM genres WHERE artist_id = 1 ORDER BY id;
" > /tmp/don_genres.json

echo "Exporting artwork_genres from $SRC..."
npx wrangler d1 execute $SRC --remote --json --command="
SELECT artwork_id, category_id as genre_id FROM artwork_genres ORDER BY artwork_id;
" > /tmp/don_artwork_genres.json

echo "Building import SQL..."
node - <<'EOF'
const fs = require('fs');

function loadResults(file) {
  const raw = JSON.parse(fs.readFileSync(file));
  if (raw.error) throw new Error(`Export failed for ${file}: ${JSON.stringify(raw.error)}`);
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr[0].results;
}

const artworks = loadResults('/tmp/don_artworks.json');
const genres = loadResults('/tmp/don_genres.json');
const artworkGenres = loadResults('/tmp/don_artwork_genres.json');

let sql = '';

// Clear existing data
sql += 'DELETE FROM artwork_genres;\n';
sql += 'DELETE FROM artworks;\n';
sql += 'DELETE FROM genres;\n';

// Insert genres
for (const g of genres) {
  const name = g.name.replace(/'/g, "''");
  const color = (g.color || '#6b7280').replace(/'/g, "''");
  const tag_type = (g.tag_type || 'subject').replace(/'/g, "''");
  const enabled = g.enabled ?? 1;
  sql += `INSERT INTO genres (id, artist_id, name, color, tag_type, enabled) VALUES (${g.id}, 1, '${name}', '${color}', '${tag_type}', ${enabled});\n`;
}

// Insert artworks
for (const a of artworks) {
  const title = (a.title || '').replace(/'/g, "''");
  const medium = a.medium ? `'${a.medium.replace(/'/g, "''")}'` : 'NULL';
  const size = a.size ? `'${a.size.replace(/'/g, "''")}'` : 'NULL';
  const price = a.price ?? 'NULL';
  const date_created = a.date_created ? `'${a.date_created}'` : 'NULL';
  const location = a.current_location ? `'${a.current_location.replace(/'/g, "''")}'` : 'NULL';
  const description = a.description ? `'${a.description.replace(/'/g, "''")}'` : 'NULL';
  const image_key = a.image_key ? `'${a.image_key.replace(/'/g, "''")}'` : 'NULL';
  const artwork_type = a.artwork_type ? `'${a.artwork_type}'` : `'artwork'`;
  sql += `INSERT INTO artworks (id, artist_id, title, medium, size, price, date_created, current_location, description, image_key, is_available, sort_order, artwork_type) VALUES (${a.id}, 1, '${title}', ${medium}, ${size}, ${price}, ${date_created}, ${location}, ${description}, ${image_key}, ${a.is_available ?? 1}, ${a.sort_order ?? 0}, ${artwork_type});\n`;
}

// Insert artwork_genres
for (const ag of artworkGenres) {
  sql += `INSERT OR IGNORE INTO artwork_genres (artwork_id, category_id) VALUES (${ag.artwork_id}, ${ag.genre_id});\n`;
}

fs.writeFileSync('/tmp/don_import.sql', sql);
console.log(`Generated SQL: ${artworks.length} artworks, ${genres.length} genres, ${artworkGenres.length} artwork-genre links`);
EOF

echo "Importing into $DST..."
npx wrangler d1 execute $DST --remote --file=/tmp/don_import.sql --config=wrangler-don.toml

echo ""
echo "✅ Migration complete!"
npx wrangler d1 execute $DST --remote --command="SELECT COUNT(*) as artworks FROM artworks;" --config=wrangler-don.toml

const fs = require('fs');

const artworks = JSON.parse(fs.readFileSync('/tmp/kathy_artworks.json'))[0].results;
const genres = JSON.parse(fs.readFileSync('/tmp/kathy_genres.json'))[0].results;
const artworkGenres = JSON.parse(fs.readFileSync('/tmp/kathy_artwork_genres.json'))[0].results;

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
  sql += `INSERT OR IGNORE INTO artwork_genres (artwork_id, genre_id) VALUES (${ag.artwork_id}, ${ag.genre_id});\n`;
}

fs.writeFileSync('/tmp/kathy_import.sql', sql);
console.log(`Generated: ${artworks.length} artworks, ${genres.length} genres, ${artworkGenres.length} artwork-genre links`);

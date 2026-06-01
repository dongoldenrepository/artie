-- Rename existing categories → genres
ALTER TABLE categories RENAME TO genres;
ALTER TABLE artwork_categories RENAME TO artwork_genres;

-- Create new categories table (medium types: 2D Art, Photography, Ceramics, etc.)
CREATE TABLE IF NOT EXISTS categories (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id    INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  color        TEXT DEFAULT '#6b7280',
  is_printable INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now'))
);

-- Add category_id to artworks
ALTER TABLE artworks ADD COLUMN category_id INTEGER REFERENCES categories(id);

-- Seed default categories for each existing artist
INSERT INTO categories (artist_id, name, color, is_printable)
  SELECT id, '2D Art', '#3b82f6', 0 FROM artists;
INSERT INTO categories (artist_id, name, color, is_printable)
  SELECT id, 'Photography', '#f59e0b', 1 FROM artists;
INSERT INTO categories (artist_id, name, color, is_printable)
  SELECT id, 'Digital Art', '#8b5cf6', 1 FROM artists;
INSERT INTO categories (artist_id, name, color, is_printable)
  SELECT id, 'Ceramics', '#ef4444', 0 FROM artists;
INSERT INTO categories (artist_id, name, color, is_printable)
  SELECT id, 'Sculpture', '#22c55e', 0 FROM artists;
INSERT INTO categories (artist_id, name, color, is_printable)
  SELECT id, 'Fiber', '#ec4899', 0 FROM artists;
INSERT INTO categories (artist_id, name, color, is_printable)
  SELECT id, 'Jewelry', '#f97316', 0 FROM artists;

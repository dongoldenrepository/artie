-- Artist Catalog Database Schema
-- Run with: wrangler d1 execute artist-catalog-db --file=migrations/0001_initial.sql

-- Artists
CREATE TABLE IF NOT EXISTS artists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  bio TEXT,
  website TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories / Genres
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id INTEGER,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

-- Artworks (core table)
CREATE TABLE IF NOT EXISTS artworks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  medium TEXT,
  size TEXT,
  price REAL,
  date_created TEXT,
  current_location TEXT,
  description TEXT,
  image_key TEXT,
  is_available INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

-- Artwork ↔ Category (many-to-many)
CREATE TABLE IF NOT EXISTS artwork_categories (
  artwork_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (artwork_id, category_id),
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Custom field definitions (per artist, extensible metadata)
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  field_type TEXT DEFAULT 'text',  -- text, number, date, url
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

-- Custom field values per artwork
CREATE TABLE IF NOT EXISTS artwork_custom_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artwork_id INTEGER NOT NULL,
  field_id INTEGER NOT NULL,
  value TEXT,
  UNIQUE(artwork_id, field_id),
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
  FOREIGN KEY (field_id) REFERENCES custom_field_definitions(id) ON DELETE CASCADE
);

-- Exhibition / Showing history
CREATE TABLE IF NOT EXISTS showings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artwork_id INTEGER NOT NULL,
  venue TEXT NOT NULL,
  location TEXT,
  start_date TEXT,
  end_date TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

-- Awards
CREATE TABLE IF NOT EXISTS awards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artwork_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  organization TEXT,
  award_date TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

-- Trigger: update artworks.updated_at on change
CREATE TRIGGER IF NOT EXISTS update_artwork_timestamp
  AFTER UPDATE ON artworks
  FOR EACH ROW
BEGIN
  UPDATE artworks SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ----------------------------------------------------------------
-- Seed data: two default artists (update names/emails as needed)
-- ----------------------------------------------------------------
INSERT OR IGNORE INTO artists (id, name, email) VALUES
  (1, 'Artist One', 'artist1@example.com'),
  (2, 'Artist Two', 'artist2@example.com');

-- Default categories for Artist 1
INSERT OR IGNORE INTO categories (artist_id, name, color) VALUES
  (1, 'Portrait',    '#ef4444'),
  (1, 'Landscape',   '#22c55e'),
  (1, 'Wildlife',    '#f59e0b'),
  (1, 'Abstract',    '#8b5cf6'),
  (1, 'Still Life',  '#3b82f6'),
  (1, 'Whimsical',   '#ec4899'),
  (1, 'Floral',      '#f97316'),
  (1, 'Seascape',    '#06b6d4');

-- Default categories for Artist 2
INSERT OR IGNORE INTO categories (artist_id, name, color) VALUES
  (2, 'Portrait',    '#ef4444'),
  (2, 'Landscape',   '#22c55e'),
  (2, 'Nature',      '#f59e0b'),
  (2, 'Abstract',    '#8b5cf6'),
  (2, 'Architecture','3b82f6'),
  (2, 'Street',      '#6b7280');

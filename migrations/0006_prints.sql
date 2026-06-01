-- Add artist_type to artists
ALTER TABLE artists ADD COLUMN artist_type TEXT DEFAULT 'painter';

-- Prints table for photographer editions
CREATE TABLE IF NOT EXISTS prints (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  artwork_id       INTEGER NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  size             TEXT,
  medium           TEXT,
  price            REAL,
  current_location TEXT,
  sold_to          TEXT,
  is_available     INTEGER DEFAULT 1,
  notes            TEXT,
  created_at       TEXT DEFAULT (datetime('now'))
);

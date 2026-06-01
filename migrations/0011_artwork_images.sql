-- Migration 0011: Additional images per artwork (multi-view carousel)
CREATE TABLE IF NOT EXISTS artwork_images (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  artwork_id  INTEGER NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  image_key   TEXT NOT NULL,
  caption     TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

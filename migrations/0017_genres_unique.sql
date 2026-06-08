-- Migration 0017: Add unique constraint on genres (artist_id, name, tag_type)
-- Prevents duplicate seed runs from creating duplicate genre rows.
-- Safe to run after deduplication (fix-duplicate-genres.sh must be run first).

CREATE UNIQUE INDEX IF NOT EXISTS idx_genres_unique
  ON genres (artist_id, name, tag_type);

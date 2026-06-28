-- Migration 0024: Enforce unique image_key per artwork
-- Prevents two artwork records from pointing to the same image file,
-- which would cause one artwork's photo to be deleted when the other is removed.
-- Partial index: allows multiple NULLs (artworks with no photo yet).
CREATE UNIQUE INDEX IF NOT EXISTS idx_artworks_image_key_unique
  ON artworks(image_key)
  WHERE image_key IS NOT NULL;

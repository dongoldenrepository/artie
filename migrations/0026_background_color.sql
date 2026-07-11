-- Migration 0026: Per-image display background color
--
-- Lets an artist pin a specific backdrop color behind a piece of artwork —
-- primarily for images with transparent backgrounds (logo PNGs, cutouts,
-- outline-only art) that would otherwise be hard to see against the app's
-- default dark/light chrome. NULL means "no color chosen — show the default
-- transparency checkerboard instead of a solid color."
--
-- Stored per-image (not per-artwork) because a single artwork can have
-- multiple images (main + extra views via artwork_images), and those
-- images don't necessarily share the same transparency needs — e.g. a
-- photo of a piece hanging on a wall alongside a transparent PNG cutout
-- of the same piece.

ALTER TABLE artworks       ADD COLUMN background_color TEXT DEFAULT NULL;
ALTER TABLE artwork_images ADD COLUMN background_color TEXT DEFAULT NULL;

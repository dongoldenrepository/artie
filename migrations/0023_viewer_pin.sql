-- Migration 0023: Per-artist viewer PIN stored in DB
-- Allows each artist to set their own viewer PIN from the admin UI.
-- NULL means fall back to VIEWER_PASSWORD env var.
ALTER TABLE artists ADD COLUMN viewer_pin TEXT;

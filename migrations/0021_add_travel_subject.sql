-- Migration 0021: Add Travel as a subject tag for all artists

INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
SELECT id, 'Travel', '#0d9488', 'subject', 1
FROM artists;

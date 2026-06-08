-- Migration 0018: Add Aircraft, Astro, Birds, Insects, Technical, Vehicles subjects
-- Uses INSERT OR IGNORE — safe to re-run; unique index prevents duplicates.

INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Aircraft',  '#60a5fa', 'subject', 1 FROM artists;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Astro',     '#4f46e5', 'subject', 1 FROM artists;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Birds',     '#84cc16', 'subject', 1 FROM artists;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Insects',   '#65a30d', 'subject', 1 FROM artists;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Technical', '#cbd5e1', 'subject', 1 FROM artists;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Vehicles',  '#dc2626', 'subject', 1 FROM artists;

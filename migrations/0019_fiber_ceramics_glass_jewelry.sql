-- Migration 0019: Add Fiber medium; Ceramics, Glass, Jewelry subjects

INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Fiber',    '#f472b6', 'medium',  1 FROM artists;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Ceramics', '#c2410c', 'subject', 1 FROM artists;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Glass',    '#0891b2', 'subject', 1 FROM artists;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Jewelry',  '#fbbf24', 'subject', 1 FROM artists;

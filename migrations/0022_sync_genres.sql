-- Migration 0022: Sync genres to canonical list (based on Mary Lynch's production DB)
-- Safe to run on any existing DB — INSERT OR IGNORE skips duplicates, UPDATEs fix colors.

-- ── New mediums ──────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Collage',     '#a78bfa', 'medium', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Digital Art', '#3b82f6', 'medium', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Encaustic',   '#f59e0b', 'medium', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Glass',       '#0891b2', 'medium', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Gouache',     '#22c55e', 'medium', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Ink',         '#1e293b', 'medium', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Pencil',      '#6b7280', 'medium', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Tempera',     '#84cc16', 'medium', 1 FROM artists WHERE id=1;

-- ── Medium color corrections ──────────────────────────────────────────────────
UPDATE genres SET color='#c2410c' WHERE artist_id=1 AND name='Ceramics'  AND tag_type='medium';
UPDATE genres SET color='#94a3b8' WHERE artist_id=1 AND name='Sculpture' AND tag_type='medium';
UPDATE genres SET color='#fbbf24' WHERE artist_id=1 AND name='Jewelry'   AND tag_type='medium';
UPDATE genres SET color='#f472b6' WHERE artist_id=1 AND name='Fiber'     AND tag_type='medium';

-- ── New styles ────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Conceptual', '#475569', 'style', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Folk Art',   '#b45309', 'style', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Minimalism', '#94a3b8', 'style', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Modernism',  '#6d28d9', 'style', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Plein Air',  '#06b6d4', 'style', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Surrealism', '#f97316', 'style', 1 FROM artists WHERE id=1;

-- ── New subjects ──────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Aerial',     '#7c3aed', 'subject', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Astro',      '#4f46e5', 'subject', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Botanical',  '#15803d', 'subject', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Cityscape',  '#475569', 'subject', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Figurative', '#8b5cf6', 'subject', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Insects',    '#65a30d', 'subject', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Interior',   '#a16207', 'subject', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Marine',     '#0ea5e9', 'subject', 1 FROM artists WHERE id=1;
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled)
  SELECT id, 'Street',     '#64748b', 'subject', 1 FROM artists WHERE id=1;

-- ── Subject color corrections ─────────────────────────────────────────────────
UPDATE genres SET color='#60a5fa' WHERE artist_id=1 AND name='Aircraft'     AND tag_type='subject';
UPDATE genres SET color='#b45309' WHERE artist_id=1 AND name='Animals'      AND tag_type='subject';
UPDATE genres SET color='#78716c' WHERE artist_id=1 AND name='Architecture' AND tag_type='subject';
UPDATE genres SET color='#84cc16' WHERE artist_id=1 AND name='Birds'        AND tag_type='subject';
UPDATE genres SET color='#3b82f6' WHERE artist_id=1 AND name='Seascape'     AND tag_type='subject';
UPDATE genres SET color='#f59e0b' WHERE artist_id=1 AND name='Still Life'   AND tag_type='subject';
UPDATE genres SET color='#cbd5e1' WHERE artist_id=1 AND name='Technical'    AND tag_type='subject';
UPDATE genres SET color='#dc2626' WHERE artist_id=1 AND name='Vehicles'     AND tag_type='subject';
UPDATE genres SET color='#06b6d4' WHERE artist_id=1 AND name='Wildlife'     AND tag_type='subject';

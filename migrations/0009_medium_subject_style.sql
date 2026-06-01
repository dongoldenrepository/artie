-- Migration 0009: Replace categories/genres with three tag axes
-- Medium (what material/process), Subject (what's depicted), Style (aesthetic approach)
-- Strategy: add tag_type to genres table; existing genre rows become 'subject'

-- 1. Add tag_type column (default 'subject' preserves all existing rows)
ALTER TABLE genres ADD COLUMN tag_type TEXT NOT NULL DEFAULT 'subject';

-- 2. Seed Medium starters for each existing artist
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Oil',          '#ef4444', 'medium' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Acrylic',      '#f97316', 'medium' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Watercolor',   '#06b6d4', 'medium' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Photography',  '#f59e0b', 'medium' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Mixed Media',  '#8b5cf6', 'medium' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Pastel',       '#ec4899', 'medium' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Charcoal',     '#78716c', 'medium' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Printmaking',  '#22c55e', 'medium' FROM artists;

-- 3. Seed Style starters for each existing artist
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Impressionism',      '#3b82f6', 'style' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Realism',            '#22c55e', 'style' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Abstract',           '#8b5cf6', 'style' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Contemporary',       '#f59e0b', 'style' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Traditional',        '#ef4444', 'style' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Photorealism',       '#06b6d4', 'style' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Expressionism',      '#ec4899', 'style' FROM artists;
INSERT INTO genres (artist_id, name, color, tag_type)
  SELECT id, 'Old Masters',        '#78716c', 'style' FROM artists;

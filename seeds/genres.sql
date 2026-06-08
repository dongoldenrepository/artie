-- Comprehensive genre seed — all tag types for all artist styles.
-- Uses INSERT OR IGNORE so it's safe to run multiple times.
-- Artists disable what doesn't apply to them.
-- Replace ARTIST_ID_PLACEHOLDER with the actual artist id before running,
-- or run via add-artist.sh which substitutes it automatically.

-- ── Medium ────────────────────────────────────────────────────
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Oil',          '#ef4444', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Acrylic',      '#f97316', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Watercolor',   '#06b6d4', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Gouache',      '#22c55e', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Pastel',       '#ec4899', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Charcoal',     '#78716c', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Pencil',       '#6b7280', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Ink',          '#1e293b', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Mixed Media',  '#8b5cf6', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Encaustic',    '#f59e0b', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Tempera',      '#84cc16', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Photography',  '#f59e0b', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Digital Art',  '#3b82f6', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Printmaking',  '#22c55e', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Collage',      '#a78bfa', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Sculpture',    '#94a3b8', 'medium', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Fiber',        '#f472b6', 'medium', 1);

-- ── Subject ───────────────────────────────────────────────────
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Portrait',     '#ef4444', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Landscape',    '#22c55e', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Still Life',   '#f59e0b', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Floral',       '#ec4899', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Wildlife',     '#06b6d4', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Seascape',     '#3b82f6', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Marine',       '#0ea5e9', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Figurative',   '#8b5cf6', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Abstract',     '#6b7280', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Architecture', '#78716c', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Cityscape',    '#475569', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Interior',     '#a16207', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Botanical',    '#15803d', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Animals',      '#b45309', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Street',       '#64748b', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Aerial',       '#7c3aed', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Aircraft',     '#60a5fa', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Astro',        '#4f46e5', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Birds',        '#84cc16', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Insects',      '#65a30d', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Technical',    '#cbd5e1', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Vehicles',     '#dc2626', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Ceramics',     '#c2410c', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Glass',        '#0891b2', 'subject', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Jewelry',      '#fbbf24', 'subject', 1);

-- ── Style ─────────────────────────────────────────────────────
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Impressionism',  '#3b82f6', 'style', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Realism',        '#22c55e', 'style', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Photorealism',   '#06b6d4', 'style', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Expressionism',  '#ec4899', 'style', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Abstract',       '#8b5cf6', 'style', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Surrealism',     '#f97316', 'style', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Traditional',    '#ef4444', 'style', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Contemporary',   '#f59e0b', 'style', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Plein Air',      '#06b6d4', 'style', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Old Masters',    '#78716c', 'style', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Modernism',      '#6d28d9', 'style', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Minimalism',     '#94a3b8', 'style', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Folk Art',       '#b45309', 'style', 1);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (ARTIST_ID_PLACEHOLDER, 'Conceptual',     '#475569', 'style', 1);

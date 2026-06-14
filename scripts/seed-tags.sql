-- Artie canonical tag seed
-- Run for every new artist. INSERT OR IGNORE is safe to re-run.

-- ── Mediums ──────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Acrylic',       '#f97316', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Ceramics',      '#c2410c', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Charcoal',      '#78716c', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Collage',       '#a78bfa', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Digital Art',   '#3b82f6', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Encaustic',     '#f59e0b', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Fiber',         '#f472b6', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Glass',         '#0891b2', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Gouache',       '#22c55e', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Ink',           '#1e293b', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Jewelry',       '#fbbf24', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Mixed Media',   '#8b5cf6', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Oil',           '#ef4444', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Pastel',        '#ec4899', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Pencil',        '#6b7280', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Photography',   '#f59e0b', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Printmaking',   '#22c55e', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Sculpture',     '#94a3b8', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Tempera',       '#84cc16', 'medium', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Watercolor',    '#06b6d4', 'medium', 0);

-- ── Subjects ─────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Abstract',      '#6b7280', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Aerial',        '#7c3aed', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Aircraft',      '#60a5fa', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Animals',       '#b45309', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Architecture',  '#78716c', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Astro',         '#4f46e5', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Birds',         '#84cc16', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Botanical',     '#15803d', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Cityscape',     '#475569', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Figurative',    '#8b5cf6', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Floral',        '#ec4899', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Insects',       '#65a30d', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Interior',      '#a16207', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Landscape',     '#22c55e', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Marine',        '#0ea5e9', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Portrait',      '#ef4444', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Seascape',      '#3b82f6', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Still Life',    '#f59e0b', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Street',        '#64748b', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Technical',     '#cbd5e1', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Travel',        '#0d9488', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Vehicles',      '#dc2626', 'subject', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Wildlife',      '#06b6d4', 'subject', 0);

-- ── Styles ───────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Abstract',      '#8b5cf6', 'style', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Conceptual',    '#475569', 'style', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Contemporary',  '#f59e0b', 'style', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Expressionism', '#ec4899', 'style', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Folk Art',      '#b45309', 'style', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Impressionism', '#3b82f6', 'style', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Minimalism',    '#94a3b8', 'style', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Modernism',     '#6d28d9', 'style', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Old Masters',   '#78716c', 'style', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Photorealism',  '#06b6d4', 'style', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Plein Air',     '#06b6d4', 'style', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Realism',       '#22c55e', 'style', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Surrealism',    '#f97316', 'style', 0);
INSERT OR IGNORE INTO genres (artist_id, name, color, tag_type, enabled) VALUES (1, 'Traditional',   '#ef4444', 'style', 0);

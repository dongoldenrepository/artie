-- Migration 0013: Add subdomain to artists for multi-tenant routing
-- Each artist's site is identified by their subdomain (e.g. "don" → don.artie-site.com)
ALTER TABLE artists ADD COLUMN subdomain TEXT;

-- Seed known artists — run per-database after applying this migration:
-- artie-don-db:    UPDATE artists SET subdomain = 'don'   WHERE id = 1;
-- kathy-catalog-db: UPDATE artists SET subdomain = 'kathy' WHERE id = 1;
-- artie-mlynch-db: UPDATE artists SET subdomain = 'mary'  WHERE id = 1;

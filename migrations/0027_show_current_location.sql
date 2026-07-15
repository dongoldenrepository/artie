-- Migration 0027: Catalog-wide setting to show "Current Location" on the
-- thumbnail (grid) page. Off by default — the field already exists per
-- artwork (current_location) and is shown in the detail panel, but most
-- catalogs don't want it cluttering the grid, so this is an opt-in toggle
-- surfaced in Catalog Settings.

ALTER TABLE artists ADD COLUMN show_current_location INTEGER DEFAULT 0;

-- Migration 0016: Align showings table with production schema
-- Adds location, start_date, end_date columns that were added directly
-- to production DBs but never captured in a migration.
-- The UI uses notes as free-form text: Gallery · Date · Award · Notes
ALTER TABLE showings ADD COLUMN location TEXT;
ALTER TABLE showings ADD COLUMN start_date TEXT;
ALTER TABLE showings ADD COLUMN end_date TEXT;

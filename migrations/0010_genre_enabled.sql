-- Migration 0010: Add enabled flag to genres
-- Disabled tags are hidden from pickers but not deleted
ALTER TABLE genres ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1;

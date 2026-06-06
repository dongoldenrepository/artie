-- Migration 0015: Remove deprecated awards table
-- Awards data is now recorded as free-text lines in the showings table
DELETE FROM awards;
DROP TABLE IF EXISTS awards;

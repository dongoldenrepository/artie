-- Migration 0012: Per-artist admin password stored in DB
-- Allows each artist to set their own password, replacing the shared env var.
-- NULL means the env.ADMIN_PASSWORD fallback is still active (triggers mustChangePassword on login).
ALTER TABLE artists ADD COLUMN admin_password TEXT;

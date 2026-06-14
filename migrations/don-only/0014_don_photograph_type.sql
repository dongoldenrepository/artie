-- Mark Don's existing artworks as photographs
-- The bulk import defaulted to 'artwork'; this corrects that.
UPDATE artworks SET artwork_type = 'photograph' WHERE artist_id = 1;

-- Also mark Don's artist record as photographer so future uploads default correctly
UPDATE artists SET artist_type = 'photographer' WHERE id = 1;

-- Add artwork_type to artworks ('artwork' or 'photograph')
ALTER TABLE artworks ADD COLUMN artwork_type TEXT DEFAULT 'artwork';

-- Mark existing artworks for photographers as 'photograph'
UPDATE artworks SET artwork_type = 'photograph'
  WHERE artist_id IN (SELECT id FROM artists WHERE artist_type = 'photographer');

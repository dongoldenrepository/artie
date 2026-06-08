-- Migration 0020: Move Ceramics, Glass, Jewelry from subject → medium

UPDATE genres SET tag_type = 'medium' WHERE name IN ('Ceramics', 'Glass', 'Jewelry') AND tag_type = 'subject';

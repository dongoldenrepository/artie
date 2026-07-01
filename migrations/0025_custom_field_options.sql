-- Add field_options to support 'select' type custom fields
-- field_options stores a JSON array of allowed values, e.g. '["paintings","drawings","digital"]'
ALTER TABLE custom_field_definitions ADD COLUMN field_options TEXT;

-- Remove brand_id from door_styles since we're merging brands and door styles into one entity
ALTER TABLE door_styles DROP COLUMN IF EXISTS brand_id;

-- Update any existing door styles that might have brand references
-- No need to do anything special here since we're just removing the foreign key
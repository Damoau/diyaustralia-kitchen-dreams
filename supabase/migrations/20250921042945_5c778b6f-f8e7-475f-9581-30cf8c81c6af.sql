-- First, check what invalid room_category_ids exist
SELECT DISTINCT room_category_id 
FROM cabinet_types 
WHERE room_category_id IS NOT NULL 
AND room_category_id NOT IN (SELECT id FROM unified_categories);

-- Update invalid room_category_ids to null or map them to valid unified_categories
UPDATE cabinet_types 
SET room_category_id = '1694110d-a503-40c6-ab49-9b735ce74bb8' -- Kitchen category
WHERE room_category_id IS NOT NULL 
AND room_category_id NOT IN (SELECT id FROM unified_categories);

-- Now drop the existing foreign key constraint
ALTER TABLE cabinet_types DROP CONSTRAINT IF EXISTS cabinet_types_room_category_id_fkey;

-- Add new foreign key constraint pointing to unified_categories
ALTER TABLE cabinet_types 
ADD CONSTRAINT cabinet_types_room_category_id_fkey 
FOREIGN KEY (room_category_id) REFERENCES unified_categories(id);
-- Drop the existing constraint that points to room_categories
ALTER TABLE cabinet_types DROP CONSTRAINT cabinet_types_room_category_id_fkey;

-- Update invalid room_category_ids to valid unified_categories id
UPDATE cabinet_types 
SET room_category_id = '1694110d-a503-40c6-ab49-9b735ce74bb8' 
WHERE room_category_id IS NOT NULL 
AND room_category_id NOT IN (SELECT id FROM unified_categories);

-- Add new constraint pointing to unified_categories
ALTER TABLE cabinet_types 
ADD CONSTRAINT cabinet_types_room_category_id_fkey 
FOREIGN KEY (room_category_id) REFERENCES unified_categories(id);
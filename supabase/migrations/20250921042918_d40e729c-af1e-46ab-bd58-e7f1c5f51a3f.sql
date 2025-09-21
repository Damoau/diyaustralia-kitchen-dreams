-- Drop the existing foreign key constraint
ALTER TABLE cabinet_types DROP CONSTRAINT IF EXISTS cabinet_types_room_category_id_fkey;

-- Add new foreign key constraint pointing to unified_categories
ALTER TABLE cabinet_types 
ADD CONSTRAINT cabinet_types_room_category_id_fkey 
FOREIGN KEY (room_category_id) REFERENCES unified_categories(id);
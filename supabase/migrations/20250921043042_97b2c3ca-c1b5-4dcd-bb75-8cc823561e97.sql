-- Remove the foreign key constraint completely
ALTER TABLE cabinet_types DROP CONSTRAINT cabinet_types_room_category_id_fkey;

-- Now add the constraint pointing to the correct table
ALTER TABLE cabinet_types 
ADD CONSTRAINT cabinet_types_room_category_id_fkey 
FOREIGN KEY (room_category_id) REFERENCES unified_categories(id);
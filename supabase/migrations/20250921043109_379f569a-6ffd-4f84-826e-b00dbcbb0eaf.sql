-- Update all invalid room_category_ids to kitchen category (the default one we saw in the network requests)
UPDATE cabinet_types 
SET room_category_id = '1694110d-a503-40c6-ab49-9b735ce74bb8' 
WHERE room_category_id IN (
  '4b7ef739-8ba9-4860-8d7f-8d6f46917c49',
  '52855e3c-a657-4f17-af89-62a567aed870', 
  'b359ad55-1629-4af7-8fde-268cdd47510b'
);

-- Now add the foreign key constraint pointing to unified_categories
ALTER TABLE cabinet_types 
ADD CONSTRAINT cabinet_types_room_category_id_fkey 
FOREIGN KEY (room_category_id) REFERENCES unified_categories(id);
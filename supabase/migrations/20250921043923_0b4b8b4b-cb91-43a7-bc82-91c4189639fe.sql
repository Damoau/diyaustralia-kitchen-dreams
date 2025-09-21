-- Fix cabinet assignments to correct room categories based on their names
-- Assign laundry cabinets to laundry room
UPDATE cabinet_types 
SET room_category_id = '85188c88-e211-468c-99e9-8e00afbe2253'
WHERE name ILIKE '%laundry%';

-- Assign vanity cabinets to vanity room  
UPDATE cabinet_types 
SET room_category_id = 'fa217ffa-4dee-4dbc-a51d-777bee5857a7'
WHERE name ILIKE '%vanity%';

-- Assign wardrobe cabinets to wardrobe room (if any)
UPDATE cabinet_types 
SET room_category_id = '1d777647-b1ad-46dd-8740-408e03a11fd5'
WHERE name ILIKE '%wardrobe%';

-- Assign outdoor cabinets to outdoor kitchen room (if any)  
UPDATE cabinet_types 
SET room_category_id = 'cf5cb7b3-90a9-47d1-b8f8-8c05927dfceb'
WHERE name ILIKE '%outdoor%';
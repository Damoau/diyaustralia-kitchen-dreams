-- Final cleanup: Move misplaced cabinets to correct rooms
-- Move Broom Cabinet to laundry (it's currently in kitchen)
UPDATE cabinet_types 
SET room_category_id = '85188c88-e211-468c-99e9-8e00afbe2253'
WHERE name = 'Broom Cabinet' AND category = 'broom';

-- Move Mirror Cabinet to vanity (it's currently in kitchen)  
UPDATE cabinet_types 
SET room_category_id = 'fa217ffa-4dee-4dbc-a51d-777bee5857a7'
WHERE name = 'Mirror Cabinet' AND category = 'mirrors';
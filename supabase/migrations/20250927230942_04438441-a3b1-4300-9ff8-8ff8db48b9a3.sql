-- Update cabinet parts formulas to use proper door pricing calculation
-- This updates the door part formula to use the combined door rate instead of separate color/finish costs

UPDATE cabinet_parts 
SET width_formula = '(((height/1000*width/1000)*qty)*door_cost)'
WHERE cabinet_type_id = 'bf62ff11-2026-4039-9879-f78cf5a7eb8c' 
  AND is_door = true 
  AND part_name = 'Door';
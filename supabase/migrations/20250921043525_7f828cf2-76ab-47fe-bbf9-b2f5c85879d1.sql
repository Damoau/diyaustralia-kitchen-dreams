-- Fix cabinet subcategory names to match unified_categories structure
UPDATE cabinet_types 
SET subcategory = 'doors' 
WHERE subcategory = 'Base Doors' AND category = 'base';

UPDATE cabinet_types 
SET subcategory = 'drawers' 
WHERE subcategory = 'drawers' AND category = 'base';

UPDATE cabinet_types 
SET subcategory = 'corners' 
WHERE subcategory = 'corners' AND category = 'base';
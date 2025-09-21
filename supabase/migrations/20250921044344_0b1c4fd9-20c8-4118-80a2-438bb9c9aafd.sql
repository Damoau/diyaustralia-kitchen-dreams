-- Fix cabinet subcategory naming to match unified_categories
UPDATE cabinet_types 
SET subcategory = 'doors' 
WHERE subcategory = 'bin_cabinets' AND category = 'base';

-- Update other mismatched subcategories
UPDATE cabinet_types 
SET subcategory = 'doors' 
WHERE subcategory IN ('Base Doors', 'doors') AND category = 'base';

UPDATE cabinet_types 
SET subcategory = 'drawers' 
WHERE subcategory IN ('Base Drawers', 'drawers') AND category = 'base';

UPDATE cabinet_types 
SET subcategory = 'corners' 
WHERE subcategory IN ('Base Corners', 'corners') AND category = 'base';
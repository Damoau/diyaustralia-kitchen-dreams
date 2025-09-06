-- Fix door style base rates to be more realistic
-- These rates are per square meter for door manufacturing

UPDATE door_styles 
SET base_rate_per_sqm = 150.00 
WHERE name = 'Laminex' AND active = true;

UPDATE door_styles 
SET base_rate_per_sqm = 120.00 
WHERE name = 'polytec' AND active = true;

UPDATE door_styles 
SET base_rate_per_sqm = 200.00 
WHERE name = 'poly' AND active = true;

UPDATE door_styles 
SET base_rate_per_sqm = 110.00 
WHERE name = 'Shadowline' AND active = true;

UPDATE door_styles 
SET base_rate_per_sqm = 115.00 
WHERE name = 'shaker' AND active = true;
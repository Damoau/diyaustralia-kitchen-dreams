-- Fix the unrealistic Laminex door style price
UPDATE door_styles 
SET base_rate_per_sqm = 120.00 
WHERE name = 'Laminex' AND base_rate_per_sqm = 9999999.00;

-- Update the Poly door style to have a more reasonable price
UPDATE door_styles 
SET base_rate_per_sqm = 150.00 
WHERE name = 'Poly' AND base_rate_per_sqm = 2000.00;
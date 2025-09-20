-- Update cabinet types to have consistent dimension ranges
-- Set max_depth_mm to 1200 for all active cabinet types that currently have 800
UPDATE cabinet_types 
SET max_depth_mm = 1200,
    updated_at = now()
WHERE active = true 
  AND max_depth_mm = 800;

-- Also ensure consistent width ranges (set min to 100 for any that might have 300)
UPDATE cabinet_types 
SET min_width_mm = 100,
    updated_at = now()
WHERE active = true 
  AND min_width_mm = 300;
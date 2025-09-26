-- Clean up duplicate Casula zones, keep only the latest one with correct percentages
DELETE FROM assembly_surcharge_zones 
WHERE zone_name IN ('Casula', 'casula') 
AND id NOT IN (
  SELECT id FROM assembly_surcharge_zones 
  WHERE zone_name = 'Casula' 
  AND carcass_surcharge_pct = 55 
  AND doors_surcharge_pct = 66 
  LIMIT 1
);
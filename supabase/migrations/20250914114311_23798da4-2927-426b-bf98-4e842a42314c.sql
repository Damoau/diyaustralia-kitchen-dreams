-- Revert the incorrect hardware requirements change
-- The original setup of 2 hinges total is correct, not 8 hinges

-- No changes needed - the current setup is correct:
-- units_per_scope = 2 (total hinges needed for this cabinet)
-- unit_scope = 'custom' (custom quantity, not per door)

-- Let's check if we have hardware options for Blum brand
SELECT 
  cho.id,
  cho.hardware_brand_id,
  cho.requirement_id,
  hb.name as brand_name,
  hp.name as product_name,
  hp.cost_per_unit
FROM cabinet_hardware_options cho
JOIN hardware_brands hb ON cho.hardware_brand_id = hb.id
JOIN hardware_products hp ON cho.hardware_product_id = hp.id
WHERE cho.requirement_id = 'e76214cb-9c00-4061-b84b-e64d15d14fb4';
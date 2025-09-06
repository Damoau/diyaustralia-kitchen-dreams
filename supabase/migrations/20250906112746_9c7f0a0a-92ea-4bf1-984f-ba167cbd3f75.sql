-- Insert hardware requirements for cabinet types
-- This defines how much hardware each cabinet type needs

-- First, let's get the cabinet type and hardware type IDs we need
-- We'll add requirements for the 4 door base cabinet

-- Add requirement: 4 door base needs 2 hinges per door (8 total hinges)
INSERT INTO cabinet_hardware_requirements (
  cabinet_type_id,
  hardware_type_id, 
  unit_scope,
  units_per_scope,
  notes,
  active
)
SELECT 
  ct.id as cabinet_type_id,
  ht.id as hardware_type_id,
  'per_door' as unit_scope,
  2 as units_per_scope,
  'Standard European hinges - 2 per door' as notes,
  true as active
FROM cabinet_types ct, hardware_types ht 
WHERE ct.name = '4 door base' 
  AND ht.name = 'Hinge'
  AND ct.active = true 
  AND ht.active = true;

-- Add requirement: 4 door base needs 1 handle per door (4 total handles)  
INSERT INTO cabinet_hardware_requirements (
  cabinet_type_id,
  hardware_type_id,
  unit_scope, 
  units_per_scope,
  notes,
  active
)
SELECT 
  ct.id as cabinet_type_id,
  ht.id as hardware_type_id,
  'per_door' as unit_scope,
  1 as units_per_scope,
  'Cabinet door handles - 1 per door' as notes,
  true as active
FROM cabinet_types ct, hardware_types ht
WHERE ct.name = '4 door base'
  AND ht.name = 'Handle'  
  AND ct.active = true
  AND ht.active = true;

-- Update hardware product costs to match your example
-- Titus hinges: $5 each
UPDATE hardware_products 
SET cost_per_unit = 5.00
WHERE hardware_brand_id = (SELECT id FROM hardware_brands WHERE name = 'Titus')
  AND hardware_type_id = (SELECT id FROM hardware_types WHERE name = 'Hinge');

-- Blum hinges: $10 each  
UPDATE hardware_products
SET cost_per_unit = 10.00
WHERE hardware_brand_id = (SELECT id FROM hardware_brands WHERE name = 'Blum')
  AND hardware_type_id = (SELECT id FROM hardware_types WHERE name = 'Hinge');

-- Titus handles: $8 each (4 handles × $8 = $32, total with hinges = $40)
UPDATE hardware_products
SET cost_per_unit = 8.00  
WHERE hardware_brand_id = (SELECT id FROM hardware_brands WHERE name = 'Titus')
  AND hardware_type_id = (SELECT id FROM hardware_types WHERE name = 'Handle');

-- Blum handles: $15 each (4 handles × $15 = $60, total with hinges = $140)
UPDATE hardware_products
SET cost_per_unit = 15.00
WHERE hardware_brand_id = (SELECT id FROM hardware_brands WHERE name = 'Blum') 
  AND hardware_type_id = (SELECT id FROM hardware_types WHERE name = 'Handle');
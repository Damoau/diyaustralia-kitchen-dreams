-- Example: Add more hardware products
-- Insert a new Blum soft-close hinge
INSERT INTO hardware_products (
  name,
  model_number,
  hardware_brand_id,
  hardware_type_id,
  cost_per_unit,
  description,
  active
) VALUES (
  'Blum Clip Top Soft Close',
  'CLIP-SOFT-110',
  'c808f420-ad8b-4c23-a9c8-1553f5373fb9', -- Blum brand ID
  'd6e5df0e-8473-42b3-bf73-7579da332aa9', -- Soft Close Hinges type ID
  18.50,
  'Premium soft-close cabinet hinge',
  true
);

-- Insert a new Titus drawer runner
INSERT INTO hardware_products (
  name,
  model_number,
  hardware_brand_id,
  hardware_type_id,
  cost_per_unit,
  description,
  active
) VALUES (
  'Titus Full Extension Runner',
  'TITUS-FE-500',
  'c8000cad-7a41-4feb-ab7d-6c49e5a54e4f', -- Titus brand ID
  '94893785-69fe-4ee6-936d-a93fb5731e26', -- Drawer Runners type ID
  42.00,
  'Full extension drawer slide system',
  true
);

-- Add a new hardware type if needed
INSERT INTO hardware_types (
  name,
  category,
  description,
  active
) VALUES (
  'Adjustable Legs',
  'support',
  'Cabinet base support legs',
  true
);
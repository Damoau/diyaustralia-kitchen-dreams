-- Step 2: Bridge existing cabinet system with product structure (fixed)

-- First, get the product option IDs we'll need
DO $$
DECLARE
    door_style_option_id uuid;
    color_option_id uuid;
    hardware_option_id uuid;
    dimensions_option_id uuid;
BEGIN
    -- Create product options for existing cabinet configuration choices
    INSERT INTO product_options (name, display_type, position) 
    VALUES 
      ('Door Style', 'dropdown', 1),
      ('Color', 'swatch', 2),
      ('Hardware Brand', 'dropdown', 3),
      ('Dimensions', 'input_group', 4)
    ON CONFLICT DO NOTHING;
    
    -- Get the option IDs
    SELECT id INTO door_style_option_id FROM product_options WHERE name = 'Door Style' LIMIT 1;
    SELECT id INTO color_option_id FROM product_options WHERE name = 'Color' LIMIT 1;
    SELECT id INTO hardware_option_id FROM product_options WHERE name = 'Hardware Brand' LIMIT 1;
    SELECT id INTO dimensions_option_id FROM product_options WHERE name = 'Dimensions' LIMIT 1;
    
    -- Create option values for door styles
    INSERT INTO option_values (product_option_id, value, code, sort_order, is_active)
    SELECT 
      door_style_option_id,
      ds.name as value,
      ds.id as code,
      ROW_NUMBER() OVER (ORDER BY ds.name) as sort_order,
      ds.active as is_active
    FROM door_styles ds
    WHERE door_style_option_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM option_values ov 
        WHERE ov.product_option_id = door_style_option_id 
        AND ov.code = ds.id
      );
    
    -- Create option values for colors with hex codes as swatches
    INSERT INTO option_values (product_option_id, value, code, swatch_hex, sort_order, is_active)
    SELECT 
      color_option_id,
      c.name as value,
      c.id as code,
      c.hex_code as swatch_hex,
      ROW_NUMBER() OVER (ORDER BY c.name) as sort_order,
      c.active as is_active
    FROM colors c
    WHERE color_option_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM option_values ov 
        WHERE ov.product_option_id = color_option_id 
        AND ov.code = c.id
      );
    
    -- Create option values for hardware brands
    INSERT INTO option_values (product_option_id, value, code, sort_order, is_active)
    SELECT 
      hardware_option_id,
      hb.name as value,
      hb.id as code,
      ROW_NUMBER() OVER (ORDER BY hb.name) as sort_order,
      hb.active as is_active
    FROM hardware_brands hb
    WHERE hardware_option_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM option_values ov 
        WHERE ov.product_option_id = hardware_option_id 
        AND ov.code = hb.id
      );
END $$;

-- Create products for cabinet types
INSERT INTO products (title, handle, description, product_type, status, vendor, thumbnail_url)
SELECT 
  ct.name as title,
  LOWER(REPLACE(REPLACE(ct.name, ' ', '-'), '/', '-')) as handle,
  COALESCE(ct.long_description, ct.short_description, 'Custom cabinet solution') as description,
  'cabinet' as product_type,
  CASE WHEN ct.active THEN 'active' ELSE 'draft' END as status,
  'DIY Australia' as vendor,
  ct.product_image_url as thumbnail_url
FROM cabinet_types ct
WHERE NOT EXISTS (
  SELECT 1 FROM products p 
  WHERE p.title = ct.name
);

-- Create default variants for each cabinet product  
INSERT INTO variants (product_id, sku, option_value_ids, width_mm, height_mm, length_mm, weight_kg, is_active, lead_time_days)
SELECT 
  p.id as product_id,
  CONCAT('CAB-', UPPER(SUBSTRING(ct.name, 1, 3)), '-', ct.default_width_mm, 'x', ct.default_height_mm) as sku,
  ARRAY[]::uuid[] as option_value_ids,
  ct.default_width_mm as width_mm,
  ct.default_height_mm as height_mm,
  ct.default_depth_mm as length_mm,
  CASE 
    WHEN ct.category = 'base' THEN 25.0
    WHEN ct.category = 'wall' THEN 15.0
    WHEN ct.category = 'tall' THEN 35.0
    ELSE 20.0
  END as weight_kg,
  ct.active as is_active,
  14 as lead_time_days
FROM cabinet_types ct
JOIN products p ON p.title = ct.name
WHERE p.product_type = 'cabinet'
  AND NOT EXISTS (
    SELECT 1 FROM variants v 
    WHERE v.product_id = p.id
  );

-- Add metafield to link variants back to cabinet_types
INSERT INTO variant_metafields (variant_id, key, value_json)
SELECT 
  v.id as variant_id,
  'cabinet_type_id' as key,
  to_jsonb(ct.id) as value_json
FROM variants v
JOIN products p ON p.id = v.product_id
JOIN cabinet_types ct ON ct.name = p.title
WHERE p.product_type = 'cabinet'
  AND NOT EXISTS (
    SELECT 1 FROM variant_metafields vm 
    WHERE vm.variant_id = v.id AND vm.key = 'cabinet_type_id'
  );
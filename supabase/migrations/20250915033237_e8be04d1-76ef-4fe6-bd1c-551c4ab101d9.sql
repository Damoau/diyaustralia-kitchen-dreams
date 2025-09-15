-- Step 2: Bridge cabinet system with products (fixed type casting)

-- Create products for cabinet types first
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

-- Create product options for each cabinet product
INSERT INTO product_options (product_id, name, display_type, position)
SELECT DISTINCT
  p.id as product_id,
  'Door Style' as name,
  'dropdown' as display_type,
  1 as position
FROM products p
WHERE p.product_type = 'cabinet'
  AND NOT EXISTS (
    SELECT 1 FROM product_options po 
    WHERE po.product_id = p.id AND po.name = 'Door Style'
  );

INSERT INTO product_options (product_id, name, display_type, position)
SELECT DISTINCT
  p.id as product_id,
  'Color' as name,
  'swatch' as display_type,
  2 as position
FROM products p
WHERE p.product_type = 'cabinet'
  AND NOT EXISTS (
    SELECT 1 FROM product_options po 
    WHERE po.product_id = p.id AND po.name = 'Color'
  );

INSERT INTO product_options (product_id, name, display_type, position)
SELECT DISTINCT
  p.id as product_id,
  'Hardware Brand' as name,
  'dropdown' as display_type,
  3 as position
FROM products p
WHERE p.product_type = 'cabinet'
  AND NOT EXISTS (
    SELECT 1 FROM product_options po 
    WHERE po.product_id = p.id AND po.name = 'Hardware Brand'
  );

-- Create option values for door styles for all cabinet products
INSERT INTO option_values (product_option_id, value, code, sort_order, is_active)
SELECT 
  po.id as product_option_id,
  ds.name as value,
  ds.id::text as code,
  ROW_NUMBER() OVER (ORDER BY ds.name) as sort_order,
  ds.active as is_active
FROM door_styles ds
CROSS JOIN product_options po
JOIN products p ON p.id = po.product_id
WHERE p.product_type = 'cabinet' 
  AND po.name = 'Door Style'
  AND NOT EXISTS (
    SELECT 1 FROM option_values ov 
    WHERE ov.product_option_id = po.id 
    AND ov.code = ds.id::text
  );

-- Create option values for colors for all cabinet products
INSERT INTO option_values (product_option_id, value, code, swatch_hex, sort_order, is_active)
SELECT 
  po.id as product_option_id,
  c.name as value,
  c.id::text as code,
  c.hex_code as swatch_hex,
  ROW_NUMBER() OVER (ORDER BY c.name) as sort_order,
  c.active as is_active
FROM colors c
CROSS JOIN product_options po
JOIN products p ON p.id = po.product_id
WHERE p.product_type = 'cabinet' 
  AND po.name = 'Color'
  AND NOT EXISTS (
    SELECT 1 FROM option_values ov 
    WHERE ov.product_option_id = po.id 
    AND ov.code = c.id::text
  );

-- Create option values for hardware brands for all cabinet products
INSERT INTO option_values (product_option_id, value, code, sort_order, is_active)
SELECT 
  po.id as product_option_id,
  hb.name as value,
  hb.id::text as code,
  ROW_NUMBER() OVER (ORDER BY hb.name) as sort_order,
  hb.active as is_active
FROM hardware_brands hb
CROSS JOIN product_options po
JOIN products p ON p.id = po.product_id
WHERE p.product_type = 'cabinet' 
  AND po.name = 'Hardware Brand'
  AND NOT EXISTS (
    SELECT 1 FROM option_values ov 
    WHERE ov.product_option_id = po.id 
    AND ov.code = hb.id::text
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
-- Remove Hettich brand and all associated products
-- First, get the Hettich brand ID
-- Delete hardware products for Hettich brand
DELETE FROM hardware_products 
WHERE hardware_brand_id = '4785c48c-fed9-4d3a-9dc1-e3fbc813546d';

-- Delete cabinet hardware options that reference Hettich products
DELETE FROM cabinet_hardware_options 
WHERE hardware_brand_id = '4785c48c-fed9-4d3a-9dc1-e3fbc813546d';

-- Finally, delete the Hettich brand itself
DELETE FROM hardware_brands 
WHERE id = '4785c48c-fed9-4d3a-9dc1-e3fbc813546d';
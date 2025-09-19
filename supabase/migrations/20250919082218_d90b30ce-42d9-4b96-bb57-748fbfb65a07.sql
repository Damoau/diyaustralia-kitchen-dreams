-- Drop old pricing-related tables
DROP TABLE IF EXISTS cabinet_type_price_ranges CASCADE;
DROP TABLE IF EXISTS door_style_finishes CASCADE;
DROP TABLE IF EXISTS color_finishes CASCADE;
DROP TABLE IF EXISTS cabinet_door_styles CASCADE;
DROP TABLE IF EXISTS cabinet_type_finishes CASCADE;
DROP TABLE IF EXISTS door_style_finish_types CASCADE;

-- Keep core tables but remove pricing-specific columns from cabinet_types
ALTER TABLE cabinet_types 
DROP COLUMN IF EXISTS base_price,
DROP COLUMN IF EXISTS stock_quantity,
DROP COLUMN IF EXISTS max_stock_level,
DROP COLUMN IF EXISTS min_stock_level;
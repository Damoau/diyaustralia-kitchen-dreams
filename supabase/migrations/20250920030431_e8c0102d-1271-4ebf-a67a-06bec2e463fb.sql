-- Add pricing fields to cabinet_types table
ALTER TABLE cabinet_types ADD COLUMN IF NOT EXISTS base_price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE cabinet_types ADD COLUMN IF NOT EXISTS material_rate_per_sqm NUMERIC(10,2) DEFAULT 85;
ALTER TABLE cabinet_types ADD COLUMN IF NOT EXISTS door_rate_per_sqm NUMERIC(10,2) DEFAULT 120;
ALTER TABLE cabinet_types ADD COLUMN IF NOT EXISTS pricing_formula TEXT;
ALTER TABLE cabinet_types ADD COLUMN IF NOT EXISTS price_calculation_method TEXT DEFAULT 'formula' CHECK (price_calculation_method IN ('formula', 'fixed', 'area_based'));

-- Add comments for clarity
COMMENT ON COLUMN cabinet_types.base_price IS 'Base price for the cabinet (used with fixed pricing method)';
COMMENT ON COLUMN cabinet_types.material_rate_per_sqm IS 'Material cost per square meter';  
COMMENT ON COLUMN cabinet_types.door_rate_per_sqm IS 'Door cost per square meter';
COMMENT ON COLUMN cabinet_types.pricing_formula IS 'Custom formula for calculating cabinet price';
COMMENT ON COLUMN cabinet_types.price_calculation_method IS 'Method used to calculate price: formula, fixed, or area_based';
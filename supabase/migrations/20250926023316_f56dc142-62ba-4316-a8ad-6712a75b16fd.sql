-- Add assembly surcharge fields to postcode_zones table
ALTER TABLE postcode_zones 
ADD COLUMN IF NOT EXISTS assembly_carcass_surcharge_pct numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS assembly_doors_surcharge_pct numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS assembly_base_carcass_price numeric DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS assembly_base_doors_price numeric DEFAULT 100.00;

-- Add comments to explain the new fields
COMMENT ON COLUMN postcode_zones.assembly_carcass_surcharge_pct IS 'Percentage surcharge for carcass assembly in this postcode zone (e.g., 10 for 10% increase)';
COMMENT ON COLUMN postcode_zones.assembly_doors_surcharge_pct IS 'Percentage surcharge for doors assembly in this postcode zone (e.g., 15 for 15% increase)'; 
COMMENT ON COLUMN postcode_zones.assembly_base_carcass_price IS 'Base price for carcass assembly before surcharges';
COMMENT ON COLUMN postcode_zones.assembly_base_doors_price IS 'Base price for doors assembly before surcharges';
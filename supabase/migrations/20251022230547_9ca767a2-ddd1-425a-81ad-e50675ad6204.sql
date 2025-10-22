-- Add minimum order amount and tiered service fee columns to colors table
ALTER TABLE colors 
ADD COLUMN IF NOT EXISTS minimum_order_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_order_message text,
ADD COLUMN IF NOT EXISTS service_fee_tier1_max numeric DEFAULT 1000,
ADD COLUMN IF NOT EXISTS service_fee_tier1_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_fee_tier2_max numeric DEFAULT 2000,
ADD COLUMN IF NOT EXISTS service_fee_tier2_amount numeric DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN colors.minimum_order_amount IS 'Minimum order amount required for this color';
COMMENT ON COLUMN colors.minimum_order_message IS 'Custom message shown when minimum not met';
COMMENT ON COLUMN colors.service_fee_tier1_max IS 'Maximum order amount for first tier (e.g., $1,000)';
COMMENT ON COLUMN colors.service_fee_tier1_amount IS 'Service fee for tier 1 (e.g., $450 when total is $100-$1,000)';
COMMENT ON COLUMN colors.service_fee_tier2_max IS 'Maximum order amount for second tier (e.g., $2,000)';
COMMENT ON COLUMN colors.service_fee_tier2_amount IS 'Service fee for tier 2 (e.g., $250 when total is $1,000-$2,000)';
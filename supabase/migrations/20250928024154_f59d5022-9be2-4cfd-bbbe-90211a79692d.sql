-- Add display_name column to cabinet_product_options if it doesn't exist
ALTER TABLE cabinet_product_options 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update existing records to use option_name as display_name where display_name is null
UPDATE cabinet_product_options 
SET display_name = option_name 
WHERE display_name IS NULL;
-- Add display_to_customers column to cabinet_product_options table
ALTER TABLE cabinet_product_options 
ADD COLUMN display_to_customers boolean NOT NULL DEFAULT true;

-- Set plastic_legs options to not display to customers by default
UPDATE cabinet_product_options 
SET display_to_customers = false 
WHERE option_type = 'plastic_legs';
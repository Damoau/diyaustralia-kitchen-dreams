-- Add 'plastic_legs' to the option_type check constraint for cabinet_product_options table

-- First, drop the existing constraint
ALTER TABLE cabinet_product_options DROP CONSTRAINT IF EXISTS cabinet_product_options_option_type_check;

-- Add the new constraint that includes 'plastic_legs'
ALTER TABLE cabinet_product_options ADD CONSTRAINT cabinet_product_options_option_type_check 
CHECK (option_type IN ('select', 'text', 'textarea', 'file_upload', 'brand_model_attachment', 'card_sentence', 'hinge_brand_set', 'runner_brand_set', 'plastic_legs'));
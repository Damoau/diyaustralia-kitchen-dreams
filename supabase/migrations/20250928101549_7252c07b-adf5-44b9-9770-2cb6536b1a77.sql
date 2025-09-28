-- Drop the existing constraint
ALTER TABLE cabinet_product_options DROP CONSTRAINT cabinet_product_options_option_type_check;

-- Add the updated constraint that includes 'hinge_side'
ALTER TABLE cabinet_product_options ADD CONSTRAINT cabinet_product_options_option_type_check 
CHECK (option_type = ANY (ARRAY[
  'select'::text, 
  'text'::text, 
  'textarea'::text, 
  'file_upload'::text, 
  'brand_model_attachment'::text, 
  'card_sentence'::text, 
  'hinge_brand_set'::text, 
  'runner_brand_set'::text, 
  'plastic_legs'::text,
  'hinge_side'::text
]));
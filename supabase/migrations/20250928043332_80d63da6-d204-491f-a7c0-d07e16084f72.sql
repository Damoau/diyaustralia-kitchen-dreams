-- Drop and recreate the constraint to include all new option types
ALTER TABLE cabinet_product_options 
DROP CONSTRAINT IF EXISTS cabinet_product_options_option_type_check;

ALTER TABLE cabinet_product_options 
ADD CONSTRAINT cabinet_product_options_option_type_check 
CHECK (option_type = ANY (ARRAY[
  'select'::text, 
  'text'::text, 
  'textarea'::text, 
  'file_upload'::text,
  'hinge_brand_set'::text,
  'runner_brand_set'::text,
  'brand_model_attachment'::text,
  'card_sentence'::text
]));
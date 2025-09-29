-- Add display_type field to cabinet_product_options to control how options are displayed
ALTER TABLE cabinet_product_options 
ADD COLUMN display_type text DEFAULT 'select' CHECK (display_type IN ('select', 'buttons'));

-- Add is_default field to cabinet_option_values to mark default selections
ALTER TABLE cabinet_option_values 
ADD COLUMN is_default boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN cabinet_product_options.display_type IS 'Controls how option is displayed: select (dropdown) or buttons';
COMMENT ON COLUMN cabinet_option_values.is_default IS 'Marks this value as the default selection for customers';
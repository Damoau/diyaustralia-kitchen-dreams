-- Add price adjustment and card display position to cabinet option values
ALTER TABLE cabinet_option_values 
ADD COLUMN price_adjustment NUMERIC DEFAULT 0,
ADD COLUMN card_display_position INTEGER;

-- Add comment for clarity
COMMENT ON COLUMN cabinet_option_values.price_adjustment IS 'Price adjustment applied when this option is selected (can be positive or negative)';
COMMENT ON COLUMN cabinet_option_values.card_display_position IS 'Position where this option should appear on the product card (for card_sentence type)';
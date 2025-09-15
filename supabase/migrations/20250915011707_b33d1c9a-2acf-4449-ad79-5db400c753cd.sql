-- Add corner cabinet support to cabinet_types table
ALTER TABLE cabinet_types 
ADD COLUMN cabinet_style TEXT DEFAULT 'standard' CHECK (cabinet_style IN ('standard', 'corner'));

-- Add corner cabinet dimension fields
ALTER TABLE cabinet_types 
ADD COLUMN right_side_width_mm INTEGER,
ADD COLUMN left_side_width_mm INTEGER,
ADD COLUMN right_side_depth_mm INTEGER,
ADD COLUMN left_side_depth_mm INTEGER;

-- Add corner cabinet part quantities
ALTER TABLE cabinet_types
ADD COLUMN qty_left_back INTEGER DEFAULT 0,
ADD COLUMN qty_right_back INTEGER DEFAULT 0,
ADD COLUMN qty_left_side INTEGER DEFAULT 0,
ADD COLUMN qty_right_side INTEGER DEFAULT 0;

-- Update existing records to have standard style
UPDATE cabinet_types SET cabinet_style = 'standard' WHERE cabinet_style IS NULL;
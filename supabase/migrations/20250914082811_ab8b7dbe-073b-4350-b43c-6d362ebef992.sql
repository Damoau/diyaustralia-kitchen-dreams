-- Add subcategory and display_order fields to cabinet_types table to support filtering and ordering
ALTER TABLE public.cabinet_types 
ADD COLUMN subcategory TEXT,
ADD COLUMN subcategory_display_order INTEGER DEFAULT 0;

-- Create an index for better performance on filtering
CREATE INDEX idx_cabinet_types_category_subcategory ON public.cabinet_types(category, subcategory, active);
CREATE INDEX idx_cabinet_types_display_order ON public.cabinet_types(display_order, subcategory_display_order);

-- Update existing records with default subcategories based on their names (you can adjust these later in admin)
UPDATE public.cabinet_types 
SET subcategory = CASE 
    WHEN LOWER(name) LIKE '%corner%' THEN 'corners'
    WHEN LOWER(name) LIKE '%drawer%' THEN 'drawers' 
    WHEN LOWER(name) LIKE '%appliance%' THEN 'appliance_cabinets'
    WHEN LOWER(name) LIKE '%bin%' THEN 'bin_cabinets'
    WHEN LOWER(name) LIKE '%lift%' OR LOWER(name) LIKE '%up%' THEN 'lift_up_systems'
    ELSE 'doors'
END
WHERE category IN ('base', 'wall', 'tall');

-- Set subcategory for panels based on their typical usage
UPDATE public.cabinet_types 
SET subcategory = CASE 
    WHEN LOWER(name) LIKE '%base%' THEN 'base'
    WHEN LOWER(name) LIKE '%wall%' OR LOWER(name) LIKE '%top%' THEN 'top'
    WHEN LOWER(name) LIKE '%tall%' OR LOWER(name) LIKE '%pantry%' THEN 'pantry'
    ELSE 'base'
END
WHERE category = 'panels';

-- Add comments for documentation
COMMENT ON COLUMN public.cabinet_types.subcategory IS 'Filter category for frontend display (doors, drawers, corners, appliance_cabinets, bin_cabinets, lift_up_systems for base/wall/tall; base, top, pantry for panels)';
COMMENT ON COLUMN public.cabinet_types.subcategory_display_order IS 'Order within subcategory for display sorting';
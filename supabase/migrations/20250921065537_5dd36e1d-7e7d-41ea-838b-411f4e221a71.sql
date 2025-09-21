-- Remove brands table and update finishes to reference door_styles
-- First, add door_style_id column to finishes table
ALTER TABLE public.finishes ADD COLUMN door_style_id uuid;

-- Add foreign key constraint to door_styles
ALTER TABLE public.finishes 
ADD CONSTRAINT finishes_door_style_id_fkey 
FOREIGN KEY (door_style_id) REFERENCES public.door_styles(id);

-- Drop the brand_id column and its constraint
ALTER TABLE public.finishes DROP CONSTRAINT IF EXISTS finishes_brand_id_fkey;
ALTER TABLE public.finishes DROP COLUMN brand_id;

-- Drop the brands table entirely
DROP TABLE IF EXISTS public.brands CASCADE;
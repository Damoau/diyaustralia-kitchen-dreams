-- Add brand_id to door_styles table to link door styles to brands
ALTER TABLE public.door_styles
ADD COLUMN brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;
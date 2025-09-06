-- Add color_id to cabinet_type_finishes table
ALTER TABLE public.cabinet_type_finishes 
ADD COLUMN color_id UUID REFERENCES public.colors(id);

-- Add part quantities columns to cabinet_types table
ALTER TABLE public.cabinet_types
ADD COLUMN backs_qty INTEGER DEFAULT 1,
ADD COLUMN bottoms_qty INTEGER DEFAULT 1, 
ADD COLUMN sides_qty INTEGER DEFAULT 2;
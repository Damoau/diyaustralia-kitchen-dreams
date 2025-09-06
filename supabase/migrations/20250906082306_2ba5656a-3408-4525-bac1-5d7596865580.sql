-- Add depth_mm to cabinet_type_finishes table for finish-specific depths
ALTER TABLE public.cabinet_type_finishes
ADD COLUMN depth_mm INTEGER;
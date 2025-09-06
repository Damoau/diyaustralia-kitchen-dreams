-- Add door_qty to cabinet_types table
ALTER TABLE public.cabinet_types
ADD COLUMN door_qty INTEGER DEFAULT 0;

-- We can keep door_count for backward compatibility but it won't be used in calculations
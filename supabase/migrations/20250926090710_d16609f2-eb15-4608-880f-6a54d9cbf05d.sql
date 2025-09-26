-- Add new fields to postcode_zones for unified management
ALTER TABLE public.postcode_zones 
ADD COLUMN IF NOT EXISTS assignment_method TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS assigned_from_zone_id UUID REFERENCES public.assembly_surcharge_zones(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_postcode_zones_assignment_method ON public.postcode_zones(assignment_method);
CREATE INDEX IF NOT EXISTS idx_postcode_zones_assigned_from_zone ON public.postcode_zones(assigned_from_zone_id);

-- Update existing records to have proper assignment method
UPDATE public.postcode_zones 
SET assignment_method = 'manual' 
WHERE assignment_method IS NULL;
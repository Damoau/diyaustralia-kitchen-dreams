-- Add assignment tracking to postcode_zones to avoid duplication
ALTER TABLE public.postcode_zones 
ADD COLUMN IF NOT EXISTS assignment_method TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS assigned_zone_id UUID REFERENCES public.assembly_surcharge_zones(id),
ADD COLUMN IF NOT EXISTS last_assignment_date TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_postcode_zones_assignment_method ON public.postcode_zones(assignment_method);
CREATE INDEX IF NOT EXISTS idx_postcode_zones_assigned_zone_id ON public.postcode_zones(assigned_zone_id);

-- Update the assembly_surcharge_zones table to track which postcodes it affects
ALTER TABLE public.assembly_surcharge_zones 
ADD COLUMN IF NOT EXISTS affected_postcodes_count INTEGER DEFAULT 0;
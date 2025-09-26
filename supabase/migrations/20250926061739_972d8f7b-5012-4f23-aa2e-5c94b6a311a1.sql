-- Create table for regional assembly surcharge settings
CREATE TABLE IF NOT EXISTS public.assembly_surcharge_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_name TEXT NOT NULL,
  center_latitude NUMERIC NOT NULL,
  center_longitude NUMERIC NOT NULL,
  radius_km INTEGER NOT NULL DEFAULT 50,
  carcass_surcharge_pct INTEGER NOT NULL DEFAULT 0,
  doors_surcharge_pct INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assembly_surcharge_zones ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage assembly surcharge zones" 
ON public.assembly_surcharge_zones 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active assembly surcharge zones" 
ON public.assembly_surcharge_zones 
FOR SELECT 
USING (active = true);

-- Create updated_at trigger
CREATE TRIGGER update_assembly_surcharge_zones_updated_at
BEFORE UPDATE ON public.assembly_surcharge_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Melbourne assembly zone
INSERT INTO public.assembly_surcharge_zones (
  zone_name,
  center_latitude,
  center_longitude,
  radius_km,
  carcass_surcharge_pct,
  doors_surcharge_pct
) VALUES (
  'Melbourne Assembly Center',
  -37.8136,
  144.9631,
  75,
  15,
  20
) ON CONFLICT DO NOTHING;
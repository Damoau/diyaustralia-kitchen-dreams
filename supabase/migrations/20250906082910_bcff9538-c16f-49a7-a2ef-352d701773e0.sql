-- Create door_style_finishes table to link finishes to door styles
CREATE TABLE public.door_style_finishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  door_style_id UUID NOT NULL REFERENCES public.door_styles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate_per_sqm NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.door_style_finishes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage door style finishes" 
ON public.door_style_finishes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active door style finishes" 
ON public.door_style_finishes 
FOR SELECT 
USING (active = true);

-- Update cabinet_type_finishes to reference door_style_finishes instead of finishes
ALTER TABLE public.cabinet_type_finishes
DROP COLUMN finish_id,
ADD COLUMN door_style_finish_id UUID REFERENCES public.door_style_finishes(id) ON DELETE SET NULL;

-- Add update trigger for door_style_finishes
CREATE TRIGGER update_door_style_finishes_updated_at
BEFORE UPDATE ON public.door_style_finishes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
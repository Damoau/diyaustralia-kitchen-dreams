-- Create cabinet_type_finishes table for linking finishes to cabinet types with colors
CREATE TABLE public.cabinet_type_finishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cabinet_type_id UUID NOT NULL REFERENCES public.cabinet_types(id) ON DELETE CASCADE,
  finish_id UUID NOT NULL REFERENCES public.finishes(id) ON DELETE CASCADE,
  door_style_id UUID REFERENCES public.door_styles(id) ON DELETE SET NULL,
  color_id UUID REFERENCES public.colors(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cabinet_type_finishes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage cabinet type finishes" 
ON public.cabinet_type_finishes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active cabinet type finishes" 
ON public.cabinet_type_finishes 
FOR SELECT 
USING (active = true);

-- Create cabinet_type_price_ranges table for width-based pricing
CREATE TABLE public.cabinet_type_price_ranges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cabinet_type_id UUID NOT NULL REFERENCES public.cabinet_types(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  min_width_mm INTEGER NOT NULL,
  max_width_mm INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cabinet_type_price_ranges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage cabinet type price ranges" 
ON public.cabinet_type_price_ranges 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active cabinet type price ranges" 
ON public.cabinet_type_price_ranges 
FOR SELECT 
USING (active = true);

-- Add part quantities columns to cabinet_types table
ALTER TABLE public.cabinet_types
ADD COLUMN backs_qty INTEGER DEFAULT 1,
ADD COLUMN bottoms_qty INTEGER DEFAULT 1, 
ADD COLUMN sides_qty INTEGER DEFAULT 2;

-- Add update trigger for cabinet_type_finishes
CREATE TRIGGER update_cabinet_type_finishes_updated_at
BEFORE UPDATE ON public.cabinet_type_finishes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add update trigger for cabinet_type_price_ranges  
CREATE TRIGGER update_cabinet_type_price_ranges_updated_at
BEFORE UPDATE ON public.cabinet_type_price_ranges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
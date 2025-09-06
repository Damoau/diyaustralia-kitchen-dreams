-- Create a table to store finish types for door styles
CREATE TABLE public.door_style_finish_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  door_style_id UUID NOT NULL,
  finish_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table to store which finishes are available for each color
CREATE TABLE public.color_finishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  color_id UUID NOT NULL,
  door_style_finish_type_id UUID NOT NULL,
  rate_per_sqm NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(color_id, door_style_finish_type_id)
);

-- Enable RLS
ALTER TABLE public.door_style_finish_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.color_finishes ENABLE ROW LEVEL SECURITY;

-- Create policies for door_style_finish_types
CREATE POLICY "Admins can manage door style finish types" 
ON public.door_style_finish_types 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active door style finish types" 
ON public.door_style_finish_types 
FOR SELECT 
USING (active = true);

-- Create policies for color_finishes
CREATE POLICY "Admins can manage color finishes" 
ON public.color_finishes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active color finishes" 
ON public.color_finishes 
FOR SELECT 
USING (active = true);

-- Add triggers for timestamps
CREATE TRIGGER update_door_style_finish_types_updated_at
BEFORE UPDATE ON public.door_style_finish_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_color_finishes_updated_at
BEFORE UPDATE ON public.color_finishes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
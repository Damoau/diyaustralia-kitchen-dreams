-- Create junction table for cabinet types and door styles with images
CREATE TABLE public.cabinet_door_styles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cabinet_type_id UUID NOT NULL,
  door_style_id UUID NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cabinet_type_id, door_style_id)
);

-- Enable RLS
ALTER TABLE public.cabinet_door_styles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage cabinet door styles" 
ON public.cabinet_door_styles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active cabinet door styles" 
ON public.cabinet_door_styles 
FOR SELECT 
USING (active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_cabinet_door_styles_updated_at
BEFORE UPDATE ON public.cabinet_door_styles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
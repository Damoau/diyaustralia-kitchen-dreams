-- Create junction table for color-door_style relationships
CREATE TABLE public.color_door_styles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  color_id uuid NOT NULL,
  door_style_id uuid NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT color_door_styles_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.colors(id) ON DELETE CASCADE,
  CONSTRAINT color_door_styles_door_style_id_fkey FOREIGN KEY (door_style_id) REFERENCES public.door_styles(id) ON DELETE CASCADE,
  CONSTRAINT color_door_styles_unique UNIQUE (color_id, door_style_id)
);

-- Enable RLS on the junction table
ALTER TABLE public.color_door_styles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for color_door_styles
CREATE POLICY "Admins can manage color door styles" 
ON public.color_door_styles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active color door styles" 
ON public.color_door_styles 
FOR SELECT 
USING (active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_color_door_styles_updated_at
BEFORE UPDATE ON public.color_door_styles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
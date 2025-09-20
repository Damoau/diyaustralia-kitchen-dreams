-- Add brand relationship to door_styles table
ALTER TABLE public.door_styles 
ADD COLUMN brand_id UUID REFERENCES public.brands(id);

-- Create junction table for door style to finish relationships
CREATE TABLE public.door_style_finishes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    door_style_id UUID NOT NULL REFERENCES public.door_styles(id) ON DELETE CASCADE,
    finish_id UUID NOT NULL REFERENCES public.finishes(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(door_style_id, finish_id)
);

-- Create junction table for color to finish relationships (granular control)
CREATE TABLE public.color_finishes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    color_id UUID NOT NULL REFERENCES public.colors(id) ON DELETE CASCADE,
    finish_id UUID NOT NULL REFERENCES public.finishes(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(color_id, finish_id)
);

-- Enable RLS on new tables
ALTER TABLE public.door_style_finishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.color_finishes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for door_style_finishes
CREATE POLICY "Admins can manage door style finishes" 
ON public.door_style_finishes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active door style finishes" 
ON public.door_style_finishes 
FOR SELECT 
USING (active = true);

-- Create RLS policies for color_finishes
CREATE POLICY "Admins can manage color finishes" 
ON public.color_finishes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active color finishes" 
ON public.color_finishes 
FOR SELECT 
USING (active = true);

-- Add updated_at trigger for door_style_finishes
CREATE TRIGGER update_door_style_finishes_updated_at
BEFORE UPDATE ON public.door_style_finishes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for color_finishes  
CREATE TRIGGER update_color_finishes_updated_at
BEFORE UPDATE ON public.color_finishes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
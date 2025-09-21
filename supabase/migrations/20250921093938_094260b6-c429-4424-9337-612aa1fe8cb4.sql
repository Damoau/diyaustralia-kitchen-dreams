-- Create user cabinet preferences table to save customization settings
CREATE TABLE public.user_cabinet_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  door_style_id UUID REFERENCES public.door_styles(id),
  color_id UUID REFERENCES public.colors(id),
  finish_id UUID REFERENCES public.finishes(id),
  default_dimensions JSONB DEFAULT '{"width": 600, "height": 720, "depth": 560}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_cabinet_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own cabinet preferences" 
ON public.user_cabinet_preferences 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_cabinet_preferences_updated_at
BEFORE UPDATE ON public.user_cabinet_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
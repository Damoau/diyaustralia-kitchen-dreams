-- Create user preferences table for cabinet styling
CREATE TABLE IF NOT EXISTS public.user_cabinet_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  preferred_door_style_id UUID,
  preferred_color_id UUID, 
  preferred_finish_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_cabinet_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can manage their own cabinet preferences" 
ON public.user_cabinet_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_cabinet_preferences_updated_at
  BEFORE UPDATE ON public.user_cabinet_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
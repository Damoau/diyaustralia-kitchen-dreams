-- Create configuration templates table for saving and reusing cabinet configurations
CREATE TABLE public.configuration_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cabinet_type_id UUID NOT NULL,
  configuration JSONB NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.configuration_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for configuration templates
CREATE POLICY "Users can view their own templates and defaults" 
ON public.configuration_templates 
FOR SELECT 
USING (user_id = auth.uid() OR is_default = true);

CREATE POLICY "Users can create their own templates" 
ON public.configuration_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.configuration_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.configuration_templates 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all templates" 
ON public.configuration_templates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add foreign key constraint
ALTER TABLE public.configuration_templates 
ADD CONSTRAINT configuration_templates_cabinet_type_id_fkey 
FOREIGN KEY (cabinet_type_id) REFERENCES public.cabinet_types(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_configuration_templates_cabinet_type_id ON public.configuration_templates(cabinet_type_id);
CREATE INDEX idx_configuration_templates_user_id ON public.configuration_templates(user_id);
CREATE INDEX idx_configuration_templates_is_default ON public.configuration_templates(is_default);

-- Create trigger for updating updated_at
CREATE TRIGGER update_configuration_templates_updated_at
  BEFORE UPDATE ON public.configuration_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add some default templates for common configurations
INSERT INTO public.configuration_templates (name, description, cabinet_type_id, configuration, is_default) 
SELECT 
  'Standard ' || ct.name,
  'Default configuration for ' || ct.name,
  ct.id,
  jsonb_build_object(
    'width', ct.default_width_mm,
    'height', ct.default_height_mm,
    'depth', ct.default_depth_mm,
    'quantity', 1,
    'configurationSource', 'unified',
    'createdAt', now(),
    'updatedAt', now()
  ),
  true
FROM public.cabinet_types ct 
WHERE ct.active = true
LIMIT 10; -- Limit to prevent too many default templates
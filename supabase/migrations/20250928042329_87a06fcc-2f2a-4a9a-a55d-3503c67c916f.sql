-- Create tables for hardware set configurations
CREATE TABLE IF NOT EXISTS public.cabinet_hardware_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_type_id UUID REFERENCES cabinet_types(id) ON DELETE CASCADE,
  hardware_category TEXT NOT NULL CHECK (hardware_category IN ('hinge', 'runner')),
  is_default BOOLEAN DEFAULT false,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for predefined hardware sets for each brand/category  
CREATE TABLE IF NOT EXISTS public.hardware_brand_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hardware_brand_id UUID REFERENCES hardware_brands(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('hinge', 'runner')),
  set_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for items in each hardware set
CREATE TABLE IF NOT EXISTS public.hardware_set_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hardware_set_id UUID REFERENCES hardware_brand_sets(id) ON DELETE CASCADE,
  hardware_product_id UUID REFERENCES hardware_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for cabinet_hardware_configurations
ALTER TABLE public.cabinet_hardware_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cabinet hardware configurations" 
ON public.cabinet_hardware_configurations FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view cabinet hardware configurations" 
ON public.cabinet_hardware_configurations FOR SELECT 
USING (true);

-- Add RLS policies for hardware_brand_sets
ALTER TABLE public.hardware_brand_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage hardware brand sets" 
ON public.hardware_brand_sets FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active hardware brand sets" 
ON public.hardware_brand_sets FOR SELECT 
USING (true);

-- Add RLS policies for hardware_set_items
ALTER TABLE public.hardware_set_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage hardware set items" 
ON public.hardware_set_items FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view hardware set items" 
ON public.hardware_set_items FOR SELECT 
USING (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_cabinet_hardware_configurations_updated_at
  BEFORE UPDATE ON public.cabinet_hardware_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hardware_brand_sets_updated_at
  BEFORE UPDATE ON public.hardware_brand_sets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample hardware sets for Blum and Titus
-- First, get the brand IDs
DO $$
DECLARE
  blum_brand_id UUID;
  titus_brand_id UUID;
  blum_hinge_set_id UUID;
  titus_hinge_set_id UUID;
  blum_runner_set_id UUID;
  titus_runner_set_id UUID;
BEGIN
  -- Get brand IDs
  SELECT id INTO blum_brand_id FROM public.hardware_brands WHERE name = 'Blum' LIMIT 1;
  SELECT id INTO titus_brand_id FROM public.hardware_brands WHERE name = 'Titus' LIMIT 1;
  
  -- Only proceed if brands exist
  IF blum_brand_id IS NOT NULL THEN
    -- Create Blum hinge set
    INSERT INTO public.hardware_brand_sets (hardware_brand_id, category, set_name, is_default)
    VALUES (blum_brand_id, 'hinge', 'Blum Standard Hinge Set', false)
    RETURNING id INTO blum_hinge_set_id;
    
    -- Create Blum runner set
    INSERT INTO public.hardware_brand_sets (hardware_brand_id, category, set_name, is_default)
    VALUES (blum_brand_id, 'runner', 'Blum Antaro Runner Set', false)
    RETURNING id INTO blum_runner_set_id;
  END IF;
  
  IF titus_brand_id IS NOT NULL THEN
    -- Create Titus hinge set (make it default)
    INSERT INTO public.hardware_brand_sets (hardware_brand_id, category, set_name, is_default)
    VALUES (titus_brand_id, 'hinge', 'Titus Standard Hinge Set', true)
    RETURNING id INTO titus_hinge_set_id;
    
    -- Create Titus runner set (make it default)
    INSERT INTO public.hardware_brand_sets (hardware_brand_id, category, set_name, is_default)
    VALUES (titus_brand_id, 'runner', 'Titus Premium Runner Set', true)
    RETURNING id INTO titus_runner_set_id;
  END IF;
  
END $$;
-- Create hardware types and brands for cabinet hardware management
CREATE TABLE public.hardware_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'hinge', 'runner', 'handle', 'lock', etc.
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hardware brands table
CREATE TABLE public.hardware_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hardware products table (specific products from brands)
CREATE TABLE public.hardware_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hardware_type_id UUID NOT NULL REFERENCES hardware_types(id),
  hardware_brand_id UUID NOT NULL REFERENCES hardware_brands(id),
  name TEXT NOT NULL,
  model_number TEXT,
  cost_per_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  specifications JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product ranges table for organizing cabinet types
CREATE TABLE public.product_ranges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add range_id to cabinet_types
ALTER TABLE public.cabinet_types 
ADD COLUMN range_id UUID REFERENCES product_ranges(id);

-- Modify colors table to relate to door_styles instead of finishes
ALTER TABLE public.colors 
DROP COLUMN finish_id,
ADD COLUMN door_style_id UUID REFERENCES door_styles(id);

-- Add more global settings for comprehensive hardware management
INSERT INTO public.global_settings (setting_key, setting_value, description) VALUES
('hinge_labor_minutes', '15', 'Labor minutes per hinge installation'),
('runner_labor_minutes', '20', 'Labor minutes per drawer runner installation'),
('labor_rate_per_hour', '85.00', 'Labor rate per hour for installation'),
('markup_percentage', '30', 'Markup percentage on hardware costs'),
('minimum_hardware_charge', '25.00', 'Minimum hardware charge per cabinet');

-- Enable RLS on new tables
ALTER TABLE public.hardware_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ranges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hardware tables
CREATE POLICY "Anyone can view hardware types" ON public.hardware_types FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage hardware types" ON public.hardware_types FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view hardware brands" ON public.hardware_brands FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage hardware brands" ON public.hardware_brands FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view hardware products" ON public.hardware_products FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage hardware products" ON public.hardware_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view product ranges" ON public.product_ranges FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage product ranges" ON public.product_ranges FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial hardware data
INSERT INTO public.hardware_brands (name, description, website_url) VALUES
('Blum', 'Austrian manufacturer of furniture fittings', 'https://www.blum.com'),
('Titus', 'Premium cabinet hardware manufacturer', 'https://www.titus.com.au'),
('Hettich', 'German furniture hardware specialist', 'https://www.hettich.com');

INSERT INTO public.hardware_types (name, category, description) VALUES
('Soft Close Hinges', 'hinge', 'Cabinet door hinges with soft close mechanism'),
('Drawer Runners', 'runner', 'Telescopic drawer slide systems'),
('Cabinet Handles', 'handle', 'Door and drawer handles'),
('Push to Open', 'mechanism', 'Touch latch systems for handleless cabinets'),
('Drawer Boxes', 'drawer', 'Complete drawer box systems');

-- Insert sample hardware products
INSERT INTO public.hardware_products (hardware_type_id, hardware_brand_id, name, model_number, cost_per_unit, description) 
SELECT 
  ht.id,
  hb.id,
  CASE 
    WHEN hb.name = 'Blum' AND ht.name = 'Soft Close Hinges' THEN 'Blum Clip Top Blumotion'
    WHEN hb.name = 'Blum' AND ht.name = 'Drawer Runners' THEN 'Blum Antaro Drawer System'
    WHEN hb.name = 'Titus' AND ht.name = 'Soft Close Hinges' THEN 'Titus Soft Close Hinge'
    WHEN hb.name = 'Titus' AND ht.name = 'Drawer Runners' THEN 'Titus Premium Runner'
  END,
  CASE 
    WHEN hb.name = 'Blum' AND ht.name = 'Soft Close Hinges' THEN 'BT-CLIPBLU'
    WHEN hb.name = 'Blum' AND ht.name = 'Drawer Runners' THEN 'BT-ANTARO'
    WHEN hb.name = 'Titus' AND ht.name = 'Soft Close Hinges' THEN 'TT-SCH'
    WHEN hb.name = 'Titus' AND ht.name = 'Drawer Runners' THEN 'TT-PR'
  END,
  CASE 
    WHEN hb.name = 'Blum' AND ht.name = 'Soft Close Hinges' THEN 12.50
    WHEN hb.name = 'Blum' AND ht.name = 'Drawer Runners' THEN 45.00
    WHEN hb.name = 'Titus' AND ht.name = 'Soft Close Hinges' THEN 15.00
    WHEN hb.name = 'Titus' AND ht.name = 'Drawer Runners' THEN 35.00
  END,
  'Professional grade cabinet hardware'
FROM hardware_types ht
CROSS JOIN hardware_brands hb
WHERE (hb.name IN ('Blum', 'Titus') AND ht.name IN ('Soft Close Hinges', 'Drawer Runners'));

-- Insert sample product ranges
INSERT INTO public.product_ranges (name, description, sort_order) VALUES
('Economy Range', 'Budget-friendly cabinet options', 1),
('Standard Range', 'Mid-tier quality and features', 2),
('Premium Range', 'High-end luxury cabinets', 3),
('Commercial Range', 'Heavy-duty commercial applications', 4);
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create door styles table
CREATE TABLE public.door_styles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_rate_per_sqm DECIMAL(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create finishes table
CREATE TABLE public.finishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  finish_type TEXT NOT NULL, -- 'laminex', 'polytec', etc
  rate_per_sqm DECIMAL(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create colors table
CREATE TABLE public.colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  finish_id UUID NOT NULL REFERENCES public.finishes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hex_code TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cabinet types table
CREATE TABLE public.cabinet_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'base', 'wall', 'pantry', 'dress_panel'
  default_width_mm INTEGER NOT NULL,
  default_height_mm INTEGER NOT NULL,
  default_depth_mm INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cabinet parts table
CREATE TABLE public.cabinet_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cabinet_type_id UUID NOT NULL REFERENCES public.cabinet_types(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL, -- 'back', 'bottom', 'side', 'door', 'hardware'
  quantity INTEGER NOT NULL DEFAULT 1,
  width_formula TEXT, -- 'width', 'depth', 'height', or custom
  height_formula TEXT, -- 'width', 'depth', 'height', or custom
  is_door BOOLEAN NOT NULL DEFAULT false,
  is_hardware BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create global settings table
CREATE TABLE public.global_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create carts table
CREATE TABLE public.carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- for guest carts
  name TEXT DEFAULT 'My Cabinet Quote',
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart items table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  cabinet_type_id UUID NOT NULL REFERENCES public.cabinet_types(id),
  width_mm INTEGER NOT NULL,
  height_mm INTEGER NOT NULL,
  depth_mm INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  finish_id UUID REFERENCES public.finishes(id),
  color_id UUID REFERENCES public.colors(id),
  door_style_id UUID REFERENCES public.door_styles(id),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  configuration JSONB, -- store additional config data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.door_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabinet_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabinet_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for product data
CREATE POLICY "Anyone can view brands" ON public.brands FOR SELECT USING (active = true);
CREATE POLICY "Anyone can view door styles" ON public.door_styles FOR SELECT USING (active = true);
CREATE POLICY "Anyone can view finishes" ON public.finishes FOR SELECT USING (active = true);
CREATE POLICY "Anyone can view colors" ON public.colors FOR SELECT USING (active = true);
CREATE POLICY "Anyone can view cabinet types" ON public.cabinet_types FOR SELECT USING (active = true);
CREATE POLICY "Anyone can view cabinet parts" ON public.cabinet_parts FOR SELECT USING (true);
CREATE POLICY "Anyone can view global settings" ON public.global_settings FOR SELECT USING (true);

-- Cart policies
CREATE POLICY "Users can manage their own carts" ON public.carts FOR ALL USING (
  auth.uid() = user_id OR (auth.uid() IS NULL AND session_id IS NOT NULL)
);
CREATE POLICY "Users can manage their cart items" ON public.cart_items FOR ALL USING (
  cart_id IN (
    SELECT id FROM public.carts 
    WHERE auth.uid() = user_id OR (auth.uid() IS NULL AND session_id IS NOT NULL)
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_global_settings_updated_at BEFORE UPDATE ON public.global_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
-- Brands
INSERT INTO public.brands (name, description) VALUES 
('Laminex', 'Premium laminate finishes'),
('Polytec', 'Contemporary laminate surfaces');

-- Door styles
INSERT INTO public.door_styles (name, description, base_rate_per_sqm) VALUES 
('Flat Panel', 'Simple flat door design', 150.00),
('Shaker', 'Traditional shaker style', 180.00),
('Modern Edge', 'Contemporary edge detail', 200.00);

-- Cabinet types for base cabinets
INSERT INTO public.cabinet_types (name, category, default_width_mm, default_height_mm, default_depth_mm) VALUES 
('1 Door Base Cabinet', 'base', 300, 720, 560),
('2 Door Base Cabinet', 'base', 600, 720, 560),
('Pot Drawer Base', 'base', 900, 720, 560);

-- Get cabinet type IDs for parts insertion
-- Cabinet parts for 1 Door Base Cabinet
INSERT INTO public.cabinet_parts (cabinet_type_id, part_name, quantity, width_formula, height_formula, is_door, is_hardware) 
SELECT id, 'Back', 1, 'width', 'height', false, false FROM public.cabinet_types WHERE name = '1 Door Base Cabinet';

INSERT INTO public.cabinet_parts (cabinet_type_id, part_name, quantity, width_formula, height_formula, is_door, is_hardware) 
SELECT id, 'Bottom', 1, 'width', 'depth', false, false FROM public.cabinet_types WHERE name = '1 Door Base Cabinet';

INSERT INTO public.cabinet_parts (cabinet_type_id, part_name, quantity, width_formula, height_formula, is_door, is_hardware) 
SELECT id, 'Sides', 2, 'depth', 'height', false, false FROM public.cabinet_types WHERE name = '1 Door Base Cabinet';

INSERT INTO public.cabinet_parts (cabinet_type_id, part_name, quantity, width_formula, height_formula, is_door, is_hardware) 
SELECT id, 'Door', 1, 'width', 'height', true, false FROM public.cabinet_types WHERE name = '1 Door Base Cabinet';

INSERT INTO public.cabinet_parts (cabinet_type_id, part_name, quantity, width_formula, height_formula, is_door, is_hardware) 
SELECT id, 'Hardware', 1, null, null, false, true FROM public.cabinet_types WHERE name = '1 Door Base Cabinet';

-- Global settings
INSERT INTO public.global_settings (setting_key, setting_value, description) VALUES 
('hmr_rate_per_sqm', '85.00', 'HMR carcass material rate per square meter'),
('hardware_base_cost', '45.00', 'Base hardware cost per cabinet'),
('gst_rate', '0.10', 'GST rate (10%)'),
('wastage_factor', '0.05', 'Material wastage factor (5%)');

-- Finishes for brands
INSERT INTO public.finishes (brand_id, name, finish_type, rate_per_sqm)
SELECT b.id, 'Gloss White', 'laminex', 95.00 FROM public.brands b WHERE b.name = 'Laminex';

INSERT INTO public.finishes (brand_id, name, finish_type, rate_per_sqm)
SELECT b.id, 'Matt Black', 'laminex', 105.00 FROM public.brands b WHERE b.name = 'Laminex';

INSERT INTO public.finishes (brand_id, name, finish_type, rate_per_sqm)
SELECT b.id, 'Natural Oak', 'polytec', 125.00 FROM public.brands b WHERE b.name = 'Polytec';

-- Colors for finishes
INSERT INTO public.colors (finish_id, name, hex_code)
SELECT f.id, 'Pure White', '#FFFFFF' FROM public.finishes f WHERE f.name = 'Gloss White';

INSERT INTO public.colors (finish_id, name, hex_code)
SELECT f.id, 'Jet Black', '#000000' FROM public.finishes f WHERE f.name = 'Matt Black';

INSERT INTO public.colors (finish_id, name, hex_code)
SELECT f.id, 'Light Oak', '#D4B896' FROM public.finishes f WHERE f.name = 'Natural Oak';
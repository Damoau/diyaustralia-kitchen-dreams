-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subcategories table
CREATE TABLE public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

-- Insert existing categories
INSERT INTO public.categories (name, display_name, description, sort_order) VALUES
('base', 'Base Cabinets', 'Floor-mounted cabinets for kitchens and bathrooms', 1),
('wall', 'Wall Cabinets', 'Wall-mounted cabinets for upper storage', 2),
('pantry', 'Pantry Cabinets', 'Tall storage cabinets for pantries and utilities', 3),
('panels', 'Dress Panels', 'Decorative panels and finishing pieces', 4);

-- Insert existing subcategories for base category
INSERT INTO public.subcategories (category_id, name, display_name, description, sort_order)
SELECT 
  c.id,
  s.name,
  s.display_name,
  s.description,
  s.sort_order
FROM public.categories c
CROSS JOIN (VALUES 
  ('doors', 'Door Cabinets', 'Base cabinets with doors', 1),
  ('drawers', 'Drawer Cabinets', 'Base cabinets with drawers', 2),
  ('bin_cabinets', 'Bin Cabinets', 'Base cabinets with pull-out bins', 3),
  ('corner_base', 'Corner Base', 'Corner base cabinets', 4)
) AS s(name, display_name, description, sort_order)
WHERE c.name = 'base';

-- Insert subcategories for wall category
INSERT INTO public.subcategories (category_id, name, display_name, description, sort_order)
SELECT 
  c.id,
  s.name,
  s.display_name,
  s.description,
  s.sort_order
FROM public.categories c
CROSS JOIN (VALUES 
  ('single_door', 'Single Door', 'Wall cabinets with single door', 1),
  ('double_door', 'Double Door', 'Wall cabinets with double doors', 2),
  ('glass_door', 'Glass Door', 'Wall cabinets with glass doors', 3),
  ('open_shelf', 'Open Shelf', 'Open wall shelving units', 4),
  ('corner_wall', 'Corner Wall', 'Corner wall cabinets', 5)
) AS s(name, display_name, description, sort_order)
WHERE c.name = 'wall';

-- Insert subcategories for pantry category
INSERT INTO public.subcategories (category_id, name, display_name, description, sort_order)
SELECT 
  c.id,
  s.name,
  s.display_name,
  s.description,
  s.sort_order
FROM public.categories c
CROSS JOIN (VALUES 
  ('tall_single', 'Tall Single', 'Single door tall cabinets', 1),
  ('tall_double', 'Tall Double', 'Double door tall cabinets', 2),
  ('tall_drawers', 'Tall with Drawers', 'Tall cabinets with drawer combinations', 3),
  ('larder', 'Larder Units', 'Full-height larder storage units', 4)
) AS s(name, display_name, description, sort_order)
WHERE c.name = 'pantry';

-- Insert subcategories for panels category
INSERT INTO public.subcategories (category_id, name, display_name, description, sort_order)
SELECT 
  c.id,
  s.name,
  s.display_name,
  s.description,
  s.sort_order
FROM public.categories c
CROSS JOIN (VALUES 
  ('end_panels', 'End Panels', 'Cabinet end finishing panels', 1),
  ('filler_strips', 'Filler Strips', 'Gap filling strips and pieces', 2),
  ('plinths', 'Plinths', 'Cabinet base plinths and kickboards', 3),
  ('cornices', 'Cornices', 'Cabinet top finishing cornices', 4)
) AS s(name, display_name, description, sort_order)
WHERE c.name = 'panels';

-- Add new columns to cabinet_types table
ALTER TABLE public.cabinet_types 
ADD COLUMN category_id UUID REFERENCES public.categories(id),
ADD COLUMN subcategory_id UUID REFERENCES public.subcategories(id);

-- Update cabinet_types to reference the new tables
UPDATE public.cabinet_types 
SET category_id = c.id
FROM public.categories c 
WHERE cabinet_types.category = c.name;

UPDATE public.cabinet_types 
SET subcategory_id = s.id
FROM public.subcategories s 
JOIN public.categories c ON s.category_id = c.id
WHERE cabinet_types.subcategory = s.name AND cabinet_types.category = c.name;

-- Create RLS policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" 
ON public.categories 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for subcategories
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subcategories" 
ON public.subcategories 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage subcategories" 
ON public.subcategories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at
  BEFORE UPDATE ON public.subcategories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
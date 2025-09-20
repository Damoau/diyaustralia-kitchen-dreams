-- Create room_categories table
CREATE TABLE public.room_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  hero_image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active room categories"
ON public.room_categories
FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage room categories"
ON public.room_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add room_category_id to cabinet_types table
ALTER TABLE public.cabinet_types 
ADD COLUMN room_category_id UUID REFERENCES public.room_categories(id);

-- Create trigger for updated_at
CREATE TRIGGER update_room_categories_updated_at
BEFORE UPDATE ON public.room_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial room categories
INSERT INTO public.room_categories (name, display_name, description, sort_order) VALUES
('kitchen', 'Kitchen Cabinets', 'Complete range of kitchen storage solutions including base, wall, and tall cabinets', 1),
('laundry', 'Laundry Cabinets', 'Organize your laundry space with base cabinets, wall storage, and utility solutions', 2),
('vanity', 'Vanity Cabinets', 'Bathroom vanity units and storage solutions for every style and space', 3),
('wardrobe', 'Wardrobe Systems', 'Complete wardrobe and closet organization systems with hanging and shelf options', 4),
('outdoor-kitchen', 'Outdoor Kitchen', 'Weather-resistant outdoor kitchen cabinets and storage solutions', 5);
-- Create meta_tags table for managing SEO metadata
CREATE TABLE IF NOT EXISTS public.meta_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL, -- 'static', 'product', 'category', 'room', 'custom'
  page_identifier TEXT NOT NULL, -- URL path or slug
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[],
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  twitter_card TEXT DEFAULT 'summary_large_image',
  canonical_url TEXT,
  robots TEXT DEFAULT 'index, follow',
  structured_data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(page_type, page_identifier)
);

-- Enable RLS
ALTER TABLE public.meta_tags ENABLE ROW LEVEL SECURITY;

-- Public can read active meta tags
CREATE POLICY "Meta tags are viewable by everyone"
ON public.meta_tags
FOR SELECT
USING (is_active = true);

-- Admins can manage meta tags
CREATE POLICY "Admins can manage meta tags"
ON public.meta_tags
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_meta_tags_page_lookup ON public.meta_tags(page_type, page_identifier) WHERE is_active = true;

-- Create trigger for updated_at
CREATE TRIGGER update_meta_tags_updated_at
BEFORE UPDATE ON public.meta_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default meta tags for main pages
INSERT INTO public.meta_tags (page_type, page_identifier, title, description, keywords, og_title, og_description) VALUES
('static', '/', 'Custom Kitchens & Cabinets | Premium Quality Manufacturing', 'Transform your space with custom-made kitchens and cabinets. Premium quality, expert craftsmanship, and personalized design solutions for Australian homes.', ARRAY['custom kitchens', 'kitchen cabinets', 'cabinet maker', 'kitchen renovation', 'custom cabinetry'], 'Custom Kitchens & Cabinets | Premium Quality', 'Expert kitchen and cabinet manufacturing with personalized design solutions'),
('static', '/shop', 'Shop Custom Cabinets | Browse Our Range', 'Explore our complete range of custom cabinets. Base cabinets, wall cabinets, and specialty units with premium finishes and hardware options.', ARRAY['buy cabinets', 'custom cabinets', 'kitchen cabinets', 'cabinet shop', 'online cabinets'], 'Shop Custom Cabinets Online', 'Browse and customize premium quality cabinets'),
('static', '/get-quote', 'Get a Custom Quote | Kitchen & Cabinet Pricing', 'Request a personalized quote for your kitchen or cabinet project. Fast turnaround, transparent pricing, and expert consultation included.', ARRAY['kitchen quote', 'cabinet quote', 'kitchen pricing', 'custom quote', 'renovation quote'], 'Get Your Custom Kitchen Quote', 'Fast, transparent pricing for your project'),
('static', '/cart', 'Shopping Cart | Your Custom Cabinet Selection', 'Review and customize your cabinet selection. Modify configurations, add hardware, and proceed to checkout.', ARRAY['shopping cart', 'cabinet cart', 'checkout'], 'Your Shopping Cart', 'Review your custom cabinet selection'),
('static', '/checkout', 'Secure Checkout | Complete Your Order', 'Complete your custom cabinet order with our secure checkout. Multiple payment options and shipping to your location.', ARRAY['checkout', 'buy cabinets', 'secure payment'], 'Secure Checkout', 'Complete your custom cabinet order'),
('static', '/manufacturing', 'Manufacturing Process | How We Build Quality', 'Discover our state-of-the-art manufacturing process. From design to delivery, quality craftsmanship in every cabinet we make.', ARRAY['cabinet manufacturing', 'production process', 'quality cabinets', 'how cabinets are made'], 'Our Manufacturing Process', 'Quality craftsmanship from design to delivery'),
('static', '/kitchen-styles', 'Kitchen Styles & Inspiration | Design Ideas', 'Explore modern, classic, and contemporary kitchen styles. Get inspired for your next renovation with our design gallery.', ARRAY['kitchen styles', 'kitchen designs', 'modern kitchens', 'classic kitchens', 'kitchen inspiration'], 'Kitchen Styles & Design Inspiration', 'Explore beautiful kitchen designs and styles'),
('static', '/price-list', 'Price List | Cabinet Pricing Guide', 'Transparent pricing for all our cabinet products. View base prices, customization options, and hardware costs.', ARRAY['cabinet prices', 'kitchen pricing', 'price list', 'cabinet cost'], 'Cabinet Price List & Pricing Guide', 'Transparent pricing for quality cabinets'),
('static', '/room-categories', 'Room Categories | Cabinets for Every Space', 'Custom cabinetry solutions for kitchens, bathrooms, laundries, and more. Purpose-built designs for every room.', ARRAY['room cabinets', 'kitchen cabinets', 'bathroom cabinets', 'laundry cabinets'], 'Cabinets for Every Room', 'Custom cabinetry for all living spaces');
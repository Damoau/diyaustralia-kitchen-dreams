-- Create quotes table and other missing core tables

-- Quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  quote_number TEXT NOT NULL UNIQUE DEFAULT ('QTE-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'expired', 'revision_requested')),
  version_number INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  valid_until DATE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  converted_order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quote items table
CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  cabinet_type_id UUID NOT NULL REFERENCES public.cabinet_types(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  width_mm INTEGER NOT NULL,
  height_mm INTEGER NOT NULL,
  depth_mm INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  configuration JSONB,
  door_style_id UUID REFERENCES public.door_styles(id),
  color_id UUID REFERENCES public.colors(id),
  finish_id UUID REFERENCES public.finishes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- Create policies for quotes
CREATE POLICY "Admins can manage all quotes" ON public.quotes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can manage their own quotes" ON public.quotes FOR ALL USING ((auth.uid() = user_id) OR ((auth.uid() IS NULL) AND (session_id IS NOT NULL)));

-- Create policies for quote items
CREATE POLICY "Users can manage their quote items" ON public.quote_items FOR ALL USING (quote_id IN (SELECT id FROM quotes WHERE (auth.uid() = user_id) OR ((auth.uid() IS NULL) AND (session_id IS NOT NULL))));
CREATE POLICY "Admins can manage all quote items" ON public.quote_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
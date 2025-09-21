-- Create quotes table if not exists
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_company TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  version_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  converted_order_id UUID
);

-- Create quote_items table if not exists
CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  cabinet_type_id UUID NOT NULL,
  door_style_id UUID,
  color_id UUID,
  finish_id UUID,
  width_mm INTEGER NOT NULL,
  height_mm INTEGER NOT NULL,
  depth_mm INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  configuration JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quotes
DROP POLICY IF EXISTS "Admins can manage all quotes" ON public.quotes;
CREATE POLICY "Admins can manage all quotes" 
ON public.quotes 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Sales reps can manage all quotes" ON public.quotes;
CREATE POLICY "Sales reps can manage all quotes" 
ON public.quotes 
FOR ALL
USING (has_role(auth.uid(), 'sales_rep'::app_role));

DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
CREATE POLICY "Users can view their own quotes" 
ON public.quotes 
FOR SELECT
USING (user_id = auth.uid() OR (auth.uid() IS NULL AND user_id IS NULL));

-- Create RLS policies for quote_items
DROP POLICY IF EXISTS "Admins can manage all quote items" ON public.quote_items;
CREATE POLICY "Admins can manage all quote items" 
ON public.quote_items 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Sales reps can manage all quote items" ON public.quote_items;
CREATE POLICY "Sales reps can manage all quote items" 
ON public.quote_items 
FOR ALL
USING (has_role(auth.uid(), 'sales_rep'::app_role));

DROP POLICY IF EXISTS "Users can view their own quote items" ON public.quote_items;
CREATE POLICY "Users can view their own quote items" 
ON public.quote_items 
FOR SELECT
USING (quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid()));

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quotes_updated_at ON public.quotes;
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_quote_items_updated_at ON public.quote_items;
CREATE TRIGGER update_quote_items_updated_at
BEFORE UPDATE ON public.quote_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit trigger for quotes
DROP TRIGGER IF EXISTS audit_quotes_changes ON public.quotes;
CREATE TRIGGER audit_quotes_changes
AFTER INSERT OR UPDATE OR DELETE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.audit_quotes_access();
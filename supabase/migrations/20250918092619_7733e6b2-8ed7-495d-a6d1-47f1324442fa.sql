-- Fix remaining function search path issues and missing RLS policies

-- Fix remaining database functions that still need search_path
CREATE OR REPLACE FUNCTION public.calculate_gst_amount(amount_ex_gst numeric, tax_rate numeric DEFAULT 0.10)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = 'public'
AS $$
BEGIN
  RETURN ROUND(amount_ex_gst * tax_rate, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $$
DECLARE
    invoice_num TEXT;
BEGIN
    invoice_num := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || 
                   LPAD((SELECT COUNT(*) + 1 FROM invoices WHERE DATE(created_at) = CURRENT_DATE)::text, 4, '0');
    RETURN invoice_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $$
DECLARE
    order_num text;
BEGIN
    order_num := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || 
                 LPAD((SELECT COUNT(*) + 1 FROM orders WHERE DATE(created_at) = CURRENT_DATE)::text, 4, '0');
    RETURN order_num;
END;
$$;

-- Check what tables have RLS enabled but no policies
-- First, let's check if inventory_transactions and products tables exist and need policies

-- Add missing RLS policies for inventory_transactions table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
    
    -- Create admin policy for inventory transactions
    DROP POLICY IF EXISTS "Admins can manage inventory transactions" ON public.inventory_transactions;
    CREATE POLICY "Admins can manage inventory transactions" 
    ON public.inventory_transactions 
    FOR ALL
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
    
    -- Create read-only policy for fulfilment team
    DROP POLICY IF EXISTS "Fulfilment can view inventory transactions" ON public.inventory_transactions;
    CREATE POLICY "Fulfilment can view inventory transactions" 
    ON public.inventory_transactions 
    FOR SELECT
    TO authenticated
    USING (has_role(auth.uid(), 'fulfilment'::app_role));
  END IF;
END
$$;

-- Add missing RLS policies for products table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    
    -- Create admin policy for products
    DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
    CREATE POLICY "Admins can manage products" 
    ON public.products 
    FOR ALL
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
    
    -- Create public read policy for active products
    DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
    CREATE POLICY "Anyone can view active products" 
    ON public.products 
    FOR SELECT
    USING (active = true);
  END IF;
END
$$;
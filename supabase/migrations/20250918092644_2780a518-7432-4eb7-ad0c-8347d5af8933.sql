-- Fix the RLS policy error and add missing policies without referencing non-existent columns

-- Add missing RLS policies for products table if it exists (without active column reference)
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
    
    -- Create public read policy for products (without active column)
    DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
    CREATE POLICY "Anyone can view products" 
    ON public.products 
    FOR SELECT
    USING (true);
  END IF;
END
$$;
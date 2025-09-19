-- Update quotes table to support admin-created quotes with customer details
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS admin_created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS customer_company text,
ADD COLUMN IF NOT EXISTS customer_abn text,
ADD COLUMN IF NOT EXISTS quote_number text UNIQUE,
ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1;

-- Make customer_email NOT NULL only if we have data
UPDATE public.quotes SET customer_email = 'unknown@example.com' WHERE customer_email IS NULL;
ALTER TABLE public.quotes ALTER COLUMN customer_email SET NOT NULL;

-- Create unique quote number generation function
CREATE OR REPLACE FUNCTION generate_quote_number() 
RETURNS TEXT AS $$
DECLARE
    quote_num TEXT;
BEGIN
    quote_num := 'QT-' || to_char(now(), 'YYYY') || '-' || 
                 LPAD((SELECT COUNT(*) + 1 FROM quotes WHERE extract(year from created_at) = extract(year from now()))::text, 4, '0');
    RETURN quote_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to auto-generate quote numbers
CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quote_number IS NULL THEN
        NEW.quote_number := generate_quote_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_quote_number ON quotes;
CREATE TRIGGER trigger_set_quote_number
    BEFORE INSERT ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION set_quote_number();

-- Create quote_items table for storing quote line items
CREATE TABLE IF NOT EXISTS public.quote_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    cabinet_type_id uuid NOT NULL REFERENCES cabinet_types(id),
    quantity integer NOT NULL DEFAULT 1,
    width_mm integer NOT NULL,
    height_mm integer NOT NULL, 
    depth_mm integer NOT NULL,
    unit_price numeric NOT NULL,
    total_price numeric NOT NULL,
    configuration jsonb,
    door_style_id uuid REFERENCES door_styles(id),
    color_id uuid REFERENCES colors(id),
    finish_id uuid REFERENCES finishes(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on quote_items
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Admins can manage all quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can view their quote items" ON public.quote_items;

-- RLS policies for quote_items
CREATE POLICY "Admins can manage all quote items" ON public.quote_items
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their quote items" ON public.quote_items
    FOR SELECT USING (
        quote_id IN (
            SELECT id FROM quotes 
            WHERE customer_email IN (
                SELECT email FROM auth.users WHERE id = auth.uid()
            )
        )
    );

-- Create admin_sessions table for impersonation tracking
CREATE TABLE IF NOT EXISTS public.admin_impersonation_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id uuid NOT NULL REFERENCES auth.users(id),
    impersonated_customer_email text NOT NULL,
    quote_id uuid REFERENCES quotes(id),
    session_token text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '2 hours'),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    ended_at timestamp with time zone
);

-- Enable RLS on admin_impersonation_sessions
ALTER TABLE public.admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policy for admin_impersonation_sessions
CREATE POLICY "Admins can manage their impersonation sessions" ON public.admin_impersonation_sessions
    FOR ALL USING (admin_user_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

-- Update quotes RLS policies to allow customer access by email
DROP POLICY IF EXISTS "Users can view their quotes by email" ON public.quotes;
DROP POLICY IF EXISTS "Users can view their quotes" ON public.quotes;

CREATE POLICY "Users can view their quotes by email" ON public.quotes
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND customer_email IN (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )) OR
        has_role(auth.uid(), 'admin'::app_role)
    );

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_quotes()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_quotes_updated_at ON quotes;
CREATE TRIGGER trigger_update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_quotes();

DROP TRIGGER IF EXISTS trigger_update_quote_items_updated_at ON quote_items;
CREATE TRIGGER trigger_update_quote_items_updated_at
    BEFORE UPDATE ON quote_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Admins can manage all quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can view their quote items" ON public.quote_items;

-- Update quotes table to support admin-created quotes with customer details
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS admin_created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS customer_company text,
ADD COLUMN IF NOT EXISTS customer_abn text,
ADD COLUMN IF NOT EXISTS quote_number text,
ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1;

-- Make customer_email not null after adding the column
UPDATE quotes SET customer_email = 'unknown@example.com' WHERE customer_email IS NULL;
ALTER TABLE public.quotes ALTER COLUMN customer_email SET NOT NULL;

-- Add unique constraint to quote_number if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotes_quote_number_key') THEN
        ALTER TABLE public.quotes ADD CONSTRAINT quotes_quote_number_key UNIQUE (quote_number);
    END IF;
END $$;

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
-- Fix function search path security issues
CREATE OR REPLACE FUNCTION generate_quote_number() 
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    quote_num TEXT;
BEGIN
    quote_num := 'QT-' || to_char(now(), 'YYYY') || '-' || 
                 LPAD((SELECT COUNT(*) + 1 FROM quotes WHERE extract(year from created_at) = extract(year from now()))::text, 4, '0');
    RETURN quote_num;
END;
$$;

CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.quote_number IS NULL THEN
        NEW.quote_number := generate_quote_number();
    END IF;
    RETURN NEW;
END;
$$;
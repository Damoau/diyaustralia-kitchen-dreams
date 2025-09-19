-- Fix Function Search Path Mutable security issue
-- Update all functions to have proper search_path settings

-- Fix generate_quote_number function
CREATE OR REPLACE FUNCTION public.generate_quote_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    quote_num TEXT;
BEGIN
    quote_num := 'QT-' || to_char(now(), 'YYYY') || '-' || 
                 LPAD((SELECT COUNT(*) + 1 FROM quotes WHERE extract(year from created_at) = extract(year from now()))::text, 4, '0');
    RETURN quote_num;
END;
$function$;

-- Fix generate_order_number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    order_num text;
BEGIN
    order_num := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || 
                 LPAD((SELECT COUNT(*) + 1 FROM orders WHERE DATE(created_at) = CURRENT_DATE)::text, 4, '0');
    RETURN order_num;
END;
$function$;

-- Fix generate_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    invoice_num TEXT;
BEGIN
    invoice_num := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || 
                   LPAD((SELECT COUNT(*) + 1 FROM invoices WHERE DATE(created_at) = CURRENT_DATE)::text, 4, '0');
    RETURN invoice_num;
END;
$function$;

-- Fix set_quote_number trigger function
CREATE OR REPLACE FUNCTION public.set_quote_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.quote_number IS NULL THEN
        NEW.quote_number := generate_quote_number();
    END IF;
    RETURN NEW;
END;
$function$;

-- Fix update_updated_at_quotes function
CREATE OR REPLACE FUNCTION public.update_updated_at_quotes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;
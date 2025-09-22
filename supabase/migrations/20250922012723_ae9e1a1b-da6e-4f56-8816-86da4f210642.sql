-- Fix security issues from the previous migration

-- Update functions to have proper search_path settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.calculate_quote_totals(quote_id UUID)
RETURNS TABLE(subtotal NUMERIC, tax_amount NUMERIC, total_amount NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(qi.total_price), 0) as subtotal,
    COALESCE(SUM(qi.total_price) * 0.1, 0) as tax_amount,
    COALESCE(SUM(qi.total_price) * 1.1, 0) as total_amount
  FROM quote_items qi
  WHERE qi.quote_id = calculate_quote_totals.quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
  totals RECORD;
BEGIN
  -- Get the quote_id (works for INSERT, UPDATE, DELETE)
  DECLARE quote_uuid UUID;
  BEGIN
    quote_uuid := COALESCE(NEW.quote_id, OLD.quote_id);
    
    -- Calculate new totals
    SELECT * INTO totals FROM public.calculate_quote_totals(quote_uuid);
    
    -- Update the quote
    UPDATE quotes 
    SET 
      subtotal = totals.subtotal,
      tax_amount = totals.tax_amount,
      total_amount = totals.total_amount,
      updated_at = NOW()
    WHERE id = quote_uuid;
    
    RETURN COALESCE(NEW, OLD);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
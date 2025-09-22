-- Fix the comprehensive quote system issues

-- 1. First, let's check what valid values are allowed for files.kind
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_kind_check;

-- Add proper constraint for files.kind that includes 'attachment'
ALTER TABLE files ADD CONSTRAINT files_kind_check 
CHECK (kind IN ('document', 'image', 'attachment', 'quote_attachment', 'message_attachment'));

-- 2. Fix RLS policies for quotes to handle both user-owned and email-based access
DROP POLICY IF EXISTS "Authenticated users can view their own quotes" ON quotes;

-- Create comprehensive RLS policy for customer quote access
CREATE POLICY "Users can view their quotes by user_id or email" ON quotes
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR 
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- 3. Add missing RLS policies for quote_items
DROP POLICY IF EXISTS "Users can view quote items for their quotes" ON quote_items;

CREATE POLICY "Users can view quote items for their quotes" ON quote_items
FOR SELECT USING (
  auth.uid() IS NOT NULL AND quote_id IN (
    SELECT id FROM quotes WHERE 
    user_id = auth.uid() OR 
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- 4. Fix messages RLS to allow customer access
DROP POLICY IF EXISTS "Users can view messages for their quotes" ON messages;

CREATE POLICY "Users can view messages for their quotes" ON messages
FOR SELECT USING (
  auth.uid() IS NOT NULL AND scope = 'quote' AND scope_id IN (
    SELECT id FROM quotes WHERE 
    user_id = auth.uid() OR 
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow customers to insert change request messages
CREATE POLICY "Users can insert change request messages" ON messages
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND 
  scope = 'quote' AND 
  message_type = 'change_request' AND
  scope_id IN (
    SELECT id FROM quotes WHERE 
    user_id = auth.uid() OR 
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- 5. Add profiles table if it doesn't exist for user lookup
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  abn TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles RLS policies
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Create trigger to auto-create profile when user signs up
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Add function to calculate quote totals
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Add trigger to auto-update quote totals when items change
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for quote totals
DROP TRIGGER IF EXISTS update_quote_totals_on_insert ON quote_items;
DROP TRIGGER IF EXISTS update_quote_totals_on_update ON quote_items;
DROP TRIGGER IF EXISTS update_quote_totals_on_delete ON quote_items;

CREATE TRIGGER update_quote_totals_on_insert
  AFTER INSERT ON quote_items
  FOR EACH ROW EXECUTE FUNCTION update_quote_totals();

CREATE TRIGGER update_quote_totals_on_update
  AFTER UPDATE ON quote_items
  FOR EACH ROW EXECUTE FUNCTION update_quote_totals();

CREATE TRIGGER update_quote_totals_on_delete
  AFTER DELETE ON quote_items
  FOR EACH ROW EXECUTE FUNCTION update_quote_totals();
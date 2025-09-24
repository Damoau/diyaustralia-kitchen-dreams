-- Fix RLS policies on quotes table to prevent unauthorized access to customer data
-- First check and drop existing policies carefully

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;  
DROP POLICY IF EXISTS "Session-based quote access" ON public.quotes;
DROP POLICY IF EXISTS "Users can manage their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Staff can manage all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Session owners can view their session quotes" ON public.quotes;

-- Create secure policies that prevent customer data leakage

-- 1. Authenticated users can only view their own quotes
CREATE POLICY "secure_user_quote_select" 
ON public.quotes 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 2. Authenticated users can manage their own quotes  
CREATE POLICY "secure_user_quote_update"
ON public.quotes
FOR UPDATE
TO authenticated  
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "secure_user_quote_delete"
ON public.quotes
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 3. Authenticated users can create quotes with proper ownership
CREATE POLICY "secure_user_quote_insert"
ON public.quotes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 4. Very restricted anonymous access - only for quote creation with session tracking
-- This allows guest quote requests but prevents data access
CREATE POLICY "secure_anonymous_quote_insert"
ON public.quotes
FOR INSERT
TO anon
WITH CHECK (
  auth.uid() IS NULL 
  AND user_id IS NULL 
  AND session_id IS NOT NULL
  AND session_id != ''
);

-- Keep existing admin and sales rep policies (they are secure)
-- These policies already exist and are properly configured:
-- "Admins can manage all quotes" - allows has_role(auth.uid(), 'admin'::app_role)  
-- "Sales reps can manage all quotes" - allows has_role(auth.uid(), 'sales_rep'::app_role)
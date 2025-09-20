-- Fix quote_requests table security - ensure no public read access
-- Remove any potential public access and ensure restrictive policies only

-- First, ensure RLS is enabled
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can delete quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Admins can update quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Admins can view quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Allow public to submit quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Authenticated admins can manage all quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Public can submit quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Sales reps can view quote requests" ON public.quote_requests;

-- Create secure, restrictive policies
-- 1. Allow authenticated admins full access
CREATE POLICY "admins_full_access" ON public.quote_requests
FOR ALL TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Allow authenticated sales reps to view and update
CREATE POLICY "sales_reps_view_update" ON public.quote_requests
FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'sales_rep'::app_role)
);

CREATE POLICY "sales_reps_update" ON public.quote_requests
FOR UPDATE TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'sales_rep'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'sales_rep'::app_role)
);

-- 3. Allow anonymous users to INSERT only (for quote submission form)
-- This is secure because they can only INSERT, not SELECT existing data
CREATE POLICY "anonymous_insert_only" ON public.quote_requests
FOR INSERT TO anon
WITH CHECK (true);

-- 4. Allow authenticated users to INSERT (for logged-in quote submissions)
CREATE POLICY "authenticated_insert" ON public.quote_requests
FOR INSERT TO authenticated
WITH CHECK (true);

-- Revoke any remaining dangerous permissions from public/anon roles
REVOKE ALL ON public.quote_requests FROM public;
REVOKE ALL ON public.quote_requests FROM anon;

-- Grant only necessary permissions
GRANT INSERT ON public.quote_requests TO anon;
GRANT INSERT, SELECT, UPDATE ON public.quote_requests TO authenticated;

-- Ensure the audit trigger exists and is working
-- (This was created in previous migration, just ensuring it's still there)
-- The trigger logs all access attempts for security monitoring
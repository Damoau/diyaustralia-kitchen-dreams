-- Fix security vulnerabilities in customer data tables
-- Ensure all policies require proper authentication and authorization

-- FIX ADDRESSES TABLE POLICIES
-- Drop and recreate with more explicit authentication checks
DROP POLICY IF EXISTS "Admins can manage all addresses" ON public.addresses;
DROP POLICY IF EXISTS "Sales reps can manage all addresses" ON public.addresses;  
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;

-- Ensure RLS is enabled
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies that require authentication
CREATE POLICY "Authenticated admins can manage all addresses" 
ON public.addresses 
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated sales reps can manage all addresses" 
ON public.addresses 
FOR ALL
TO authenticated  
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'sales_rep'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'sales_rep'::app_role)
);

CREATE POLICY "Authenticated users can manage their own addresses" 
ON public.addresses 
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

-- FIX CONTACTS TABLE POLICIES  
-- Drop and recreate with proper authentication
DROP POLICY IF EXISTS "Admins can manage all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Sales reps can manage all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.contacts;

-- Ensure RLS is enabled
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated admins can manage all contacts" 
ON public.contacts 
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated sales reps can manage all contacts" 
ON public.contacts 
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'sales_rep'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'sales_rep'::app_role)
);

CREATE POLICY "Authenticated users can manage their own contacts" 
ON public.contacts 
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);
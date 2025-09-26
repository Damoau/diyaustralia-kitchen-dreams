-- Fix Critical Security Issues (Corrected)

-- 1. Fix Checkout Table RLS Policies
-- Drop existing overly permissive policies if they exist
DROP POLICY IF EXISTS "Users can manage their own checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Admins can manage all checkouts" ON public.checkouts;

-- Create secure checkout policies
CREATE POLICY "Users can manage own checkouts by user_id" 
ON public.checkouts 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can manage checkouts by session_id" 
ON public.checkouts 
FOR ALL 
USING (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id != '')
WITH CHECK (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id != '');

CREATE POLICY "Admins can manage all checkouts" 
ON public.checkouts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix Quote Requests Policy Conflicts
-- Remove the conflicting deny_all_public_access policy
DROP POLICY IF EXISTS "deny_all_public_access" ON public.quote_requests;

-- Ensure the remaining policies are correct
DROP POLICY IF EXISTS "anonymous_insert_only" ON public.quote_requests;
DROP POLICY IF EXISTS "authenticated_insert" ON public.quote_requests;

-- Create clean quote request policies
CREATE POLICY "Anonymous can submit quote requests" 
ON public.quote_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated can submit quote requests" 
ON public.quote_requests 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can manage all quote requests" 
ON public.quote_requests 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales reps can view quote requests" 
ON public.quote_requests 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'sales_rep'::app_role));

CREATE POLICY "Sales reps can update quote requests" 
ON public.quote_requests 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'sales_rep'::app_role))
WITH CHECK (has_role(auth.uid(), 'sales_rep'::app_role));

-- 3. Fix Cart RLS Policies for Anonymous Users
-- Drop existing cart policies and recreate them properly
DROP POLICY IF EXISTS "Admins can manage all carts" ON public.carts;
DROP POLICY IF EXISTS "Users can manage their own carts" ON public.carts;

-- Create secure cart policies that work for both authenticated and anonymous users
CREATE POLICY "Authenticated users can manage own carts" 
ON public.carts 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can manage session carts" 
ON public.carts 
FOR ALL 
USING (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL AND session_id != '')
WITH CHECK (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL AND session_id != '');

CREATE POLICY "Admins can manage all carts" 
ON public.carts 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
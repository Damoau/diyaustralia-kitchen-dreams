-- Fix critical security vulnerability in carts table
-- The current RLS policy allows any unauthenticated user to see all carts with session_id
-- This exposes all guest shopping carts to everyone

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can manage their own carts" ON public.carts;

-- Create a secure policy that only allows authenticated users to access their own carts
CREATE POLICY "Authenticated users can manage their own carts" 
ON public.carts 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- For guest carts, we'll handle access through application logic rather than RLS
-- This prevents the security vulnerability while maintaining functionality
-- Guest carts will need to be accessed through server functions that validate session ownership
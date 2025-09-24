-- Fix RLS policies on quotes table to prevent unauthorized access to customer data

-- Drop the problematic policies that allow too broad access
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Session-based quote access" ON public.quotes;

-- Create more secure policies

-- Users can only view quotes where they are the owner AND authenticated
CREATE POLICY "Authenticated users can view their own quotes" 
ON public.quotes 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Restricted session-based access - only for the specific session that created the quote
CREATE POLICY "Session owners can view their session quotes" 
ON public.quotes 
FOR SELECT 
TO anon
USING (
  auth.uid() IS NULL 
  AND session_id IS NOT NULL 
  AND session_id = current_setting('request.headers')::json->>'x-session-id'
);

-- Users can only update their own quotes when authenticated
CREATE POLICY "Authenticated users can update their own quotes"
ON public.quotes
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can only delete their own quotes when authenticated  
CREATE POLICY "Authenticated users can delete their own quotes"
ON public.quotes
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Ensure quotes created by authenticated users have proper user_id
DROP POLICY IF EXISTS "Users can create quotes" ON public.quotes;
CREATE POLICY "Authenticated users can create quotes with proper ownership"
ON public.quotes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Allow anonymous quote creation only with session tracking (for quote requests)
CREATE POLICY "Anonymous users can create session quotes"
ON public.quotes
FOR INSERT
TO anon
WITH CHECK (
  auth.uid() IS NULL 
  AND user_id IS NULL 
  AND session_id IS NOT NULL
);

-- Drop duplicate staff policy (already covered by individual admin/sales rep policies)
DROP POLICY IF EXISTS "Staff can manage all quotes" ON public.quotes;
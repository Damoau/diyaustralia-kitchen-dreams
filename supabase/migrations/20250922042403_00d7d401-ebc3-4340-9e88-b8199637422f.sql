-- Fix RLS policy on quote_items that's causing permission denied error
-- Remove the problematic policy that tries to access auth.users table
DROP POLICY IF EXISTS "Users can view quote items for their quotes" ON public.quote_items;

-- The existing policies should be sufficient:
-- - "Admins can manage all quote items" for admin access
-- - "Sales reps can manage all quote items" for sales rep access  
-- - "Users can view their own quote items" for user_id = auth.uid()
-- - "Users can manage their quote items" for general user access
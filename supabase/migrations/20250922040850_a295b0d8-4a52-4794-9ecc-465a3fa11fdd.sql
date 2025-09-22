-- Fix RLS policy that's causing permission denied error
-- Remove the problematic policy that tries to access auth.users table
DROP POLICY IF EXISTS "Users can view their quotes by user_id or email" ON public.quotes;

-- The existing policies should be sufficient:
-- - "Users can manage their own quotes" for user_id = auth.uid()
-- - "Session-based quote access" for anonymous users
-- - "Admins can manage all quotes" for admin access
-- - "Staff can manage all quotes" for admin/sales rep access
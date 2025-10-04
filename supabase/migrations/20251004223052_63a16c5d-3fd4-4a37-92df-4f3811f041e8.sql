-- Add RLS policies for cart_activity_log to prevent public data scraping

-- Enable RLS on cart_activity_log if not already enabled
ALTER TABLE public.cart_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "cart_activity_admin_full_access" ON public.cart_activity_log;
DROP POLICY IF EXISTS "cart_activity_user_own_select" ON public.cart_activity_log;
DROP POLICY IF EXISTS "cart_activity_system_insert" ON public.cart_activity_log;

-- Admins can view all cart activity
CREATE POLICY "cart_activity_admin_full_access"
ON public.cart_activity_log
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can only view their own cart activity
CREATE POLICY "cart_activity_user_own_select"
ON public.cart_activity_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- System can insert cart activity logs
CREATE POLICY "cart_activity_system_insert"
ON public.cart_activity_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
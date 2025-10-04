-- Phase 1 Critical Security Fixes: Lock Down Public Data Exposure

-- 1. FIX CRITICAL: User Sessions Table Public Exposure
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "System can insert user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can manage all user sessions" ON public.user_sessions;

-- Create secure policies for user_sessions
CREATE POLICY "user_sessions_admin_full_access"
ON public.user_sessions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_sessions_owner_select"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_sessions_system_insert"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_sessions_owner_update"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2. FIX HIGH: Carts Table Excessive Public Access
-- Drop overly permissive anonymous policies
DROP POLICY IF EXISTS "Anonymous users can create carts with session_id" ON public.carts;
DROP POLICY IF EXISTS "Anonymous users can view their session carts" ON public.carts;
DROP POLICY IF EXISTS "Anonymous users can update their session carts" ON public.carts;
DROP POLICY IF EXISTS "Anonymous users can delete their session carts" ON public.carts;

-- Create time-limited anonymous cart access (24 hour expiry)
CREATE POLICY "carts_anonymous_recent_select"
ON public.carts
FOR SELECT
TO anon
USING (
  session_id IS NOT NULL 
  AND session_id <> '' 
  AND created_at > now() - interval '24 hours'
);

CREATE POLICY "carts_anonymous_recent_insert"
ON public.carts
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL 
  AND session_id IS NOT NULL 
  AND session_id <> ''
);

CREATE POLICY "carts_anonymous_recent_update"
ON public.carts
FOR UPDATE
TO anon
USING (
  session_id IS NOT NULL 
  AND session_id <> '' 
  AND created_at > now() - interval '24 hours'
)
WITH CHECK (
  session_id IS NOT NULL 
  AND session_id <> '' 
  AND created_at > now() - interval '24 hours'
);

CREATE POLICY "carts_anonymous_recent_delete"
ON public.carts
FOR DELETE
TO anon
USING (
  session_id IS NOT NULL 
  AND session_id <> '' 
  AND created_at > now() - interval '24 hours'
);

-- 3. FIX HIGH: Shipments Table Access Control
-- Ensure only authorized users can access shipment data
DROP POLICY IF EXISTS "Fulfilment team can manage shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can view their shipments" ON public.shipments;

CREATE POLICY "shipments_admin_full_access"
ON public.shipments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "shipments_fulfilment_full_access"
ON public.shipments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'fulfilment'::app_role))
WITH CHECK (has_role(auth.uid(), 'fulfilment'::app_role));

CREATE POLICY "shipments_customer_view_own"
ON public.shipments
FOR SELECT
TO authenticated
USING (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE user_id = auth.uid()
  )
);

-- 4. Add data retention function for old anonymous data
CREATE OR REPLACE FUNCTION public.cleanup_old_anonymous_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete anonymous carts older than 30 days
  DELETE FROM public.carts
  WHERE user_id IS NULL
    AND session_id IS NOT NULL
    AND created_at < now() - interval '30 days';
    
  -- Delete anonymous user sessions older than 90 days
  DELETE FROM public.user_sessions
  WHERE user_id IS NULL
    AND created_at < now() - interval '90 days';
    
  -- Log cleanup action
  PERFORM public.log_audit_event(
    p_scope := 'data_retention',
    p_action := 'anonymous_data_cleanup',
    p_after_data := json_build_object(
      'timestamp', now()
    )::text
  );
END;
$$;
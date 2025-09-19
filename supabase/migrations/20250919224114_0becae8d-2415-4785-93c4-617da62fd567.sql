-- Critical Security Fix: Add missing RLS policies for sensitive customer data

-- Fix quotes table RLS policies
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Staff can manage all quotes" ON public.quotes;

CREATE POLICY "Users can view their own quotes" 
ON public.quotes 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales_rep'::app_role)
  )
);

CREATE POLICY "Users can create quotes" 
ON public.quotes 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_id = auth.uid()
);

CREATE POLICY "Staff can manage all quotes" 
ON public.quotes 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'sales_rep'::app_role)
);

-- Fix checkouts table - already has policies but strengthen them
-- (checkouts table already has proper RLS policies)

-- Fix contacts table - strengthen existing policies
-- (contacts table already has proper RLS policies)

-- Fix addresses table - strengthen existing policies  
-- (addresses table already has proper RLS policies)

-- Critical: Fix user_roles table to prevent privilege escalation
DROP POLICY IF EXISTS "Prevent unauthorized role assignment" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot assign admin roles" ON public.user_roles;

CREATE POLICY "Prevent unauthorized role assignment" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  -- Only admins can assign roles, and users cannot self-assign admin roles
  has_role(auth.uid(), 'admin'::app_role) AND 
  (user_id != auth.uid() OR role != 'admin'::app_role)
);

CREATE POLICY "Only admins can modify roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix profiles table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    
    -- Create secure policies
    EXECUTE 'CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT USING (
      auth.uid() IS NOT NULL AND (
        id = auth.uid() OR 
        has_role(auth.uid(), ''admin''::app_role) OR 
        has_role(auth.uid(), ''sales_rep''::app_role)
      )
    )';
    
    EXECUTE 'CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (
      auth.uid() IS NOT NULL AND id = auth.uid()
    )';
    
    EXECUTE 'CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (
      auth.uid() IS NOT NULL AND id = auth.uid()
    )';
  END IF;
END $$;

-- Add audit logging for sensitive data access
CREATE OR REPLACE TRIGGER audit_quotes_access
  AFTER INSERT OR UPDATE OR DELETE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.audit_quote_requests_access();

CREATE OR REPLACE TRIGGER audit_contacts_access
  AFTER INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_data_access();

CREATE OR REPLACE TRIGGER audit_addresses_access
  AFTER INSERT OR UPDATE OR DELETE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_data_access();

-- Create security monitoring function for failed authentication attempts
CREATE OR REPLACE FUNCTION public.log_failed_auth_attempt(p_email text, p_ip_address inet DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.log_audit_event(
    p_actor_id := NULL,
    p_scope := 'auth_failed',
    p_action := 'login_failed',
    p_after_data := json_build_object('email', p_email, 'timestamp', now())::text,
    p_ip_address := p_ip_address
  );
END;
$$;

-- Add rate limiting table for server-side control
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP address or user ID
  action text NOT NULL, -- login, api_call, etc.
  attempts integer NOT NULL DEFAULT 0,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action 
ON public.rate_limits(identifier, action);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start 
ON public.rate_limits(window_start);

-- RLS for rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (true);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_attempts integer := 0;
  v_window_start timestamp with time zone;
  v_blocked_until timestamp with time zone;
BEGIN
  -- Clean up old entries
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour';
  
  -- Get current rate limit record
  SELECT attempts, window_start, blocked_until 
  INTO v_current_attempts, v_window_start, v_blocked_until
  FROM public.rate_limits
  WHERE identifier = p_identifier AND action = p_action;
  
  -- Check if currently blocked
  IF v_blocked_until IS NOT NULL AND v_blocked_until > now() THEN
    RETURN false;
  END IF;
  
  -- Check if within time window
  IF v_window_start IS NULL OR v_window_start < now() - (p_window_minutes || ' minutes')::interval THEN
    -- Reset window
    INSERT INTO public.rate_limits (identifier, action, attempts, window_start)
    VALUES (p_identifier, p_action, 1, now())
    ON CONFLICT (identifier, action) 
    DO UPDATE SET 
      attempts = 1,
      window_start = now(),
      blocked_until = NULL,
      updated_at = now();
    RETURN true;
  END IF;
  
  -- Increment attempts
  UPDATE public.rate_limits
  SET attempts = attempts + 1,
      blocked_until = CASE 
        WHEN attempts + 1 >= p_max_attempts 
        THEN now() + (p_window_minutes || ' minutes')::interval
        ELSE NULL
      END,
      updated_at = now()
  WHERE identifier = p_identifier AND action = p_action;
  
  -- Return false if limit exceeded
  RETURN v_current_attempts + 1 < p_max_attempts;
END;
$$;
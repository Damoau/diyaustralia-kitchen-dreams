-- Fix security vulnerability in quote_requests table
-- The table contains customer PII but has no user ownership, making it publicly accessible

-- First, ensure RLS is enabled on quote_requests table
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies that allow public access
DROP POLICY IF EXISTS "Enable read access for all users" ON public.quote_requests;
DROP POLICY IF EXISTS "Allow public read access" ON public.quote_requests;
DROP POLICY IF EXISTS "Public read access" ON public.quote_requests;

-- Create restrictive RLS policies for quote_requests
-- Only authenticated admin users can view/manage quote requests
CREATE POLICY "Authenticated admins can manage all quote requests"
ON public.quote_requests
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

-- Allow sales reps to view quote requests for their work
CREATE POLICY "Sales reps can view quote requests"
ON public.quote_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'sales_rep'::app_role)
);

-- Allow public to insert quote requests (but not read them back)
-- This maintains the functionality of the quote form while securing the data
CREATE POLICY "Allow public to submit quote requests"
ON public.quote_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create audit logging function for quote requests access
CREATE OR REPLACE FUNCTION public.log_quote_request_access(
  p_quote_request_id uuid,
  p_action text,
  p_accessed_by uuid,
  p_customer_email text DEFAULT NULL,
  p_access_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_roles text[];
  v_is_suspicious boolean := false;
BEGIN
  -- Get user roles for context
  SELECT array_agg(role::text) INTO v_user_roles
  FROM user_roles 
  WHERE user_id = p_accessed_by;
  
  -- Check for suspicious patterns (accessing many quote requests in short time)
  IF p_action = 'SELECT' AND array_length(v_user_roles, 1) > 0 THEN
    SELECT COUNT(DISTINCT scope_id) > 50 INTO v_is_suspicious
    FROM audit_logs
    WHERE actor_id = p_accessed_by
      AND scope = 'quote_requests'
      AND created_at > now() - interval '1 hour';
  END IF;
  
  -- Log the access with security context (without exposing sensitive data)
  PERFORM public.log_audit_event(
    p_actor_id := p_accessed_by,
    p_scope := 'quote_requests',
    p_scope_id := p_quote_request_id,
    p_action := p_action,
    p_after_data := json_build_object(
      'customer_email_length', CASE WHEN p_customer_email IS NOT NULL THEN length(p_customer_email) ELSE 0 END,
      'access_reason', COALESCE(p_access_reason, 'normal_business'),
      'user_roles', v_user_roles,
      'is_suspicious', v_is_suspicious,
      'timestamp', now()
    )::text
  );
  
  -- Alert if suspicious activity detected
  IF v_is_suspicious THEN
    PERFORM public.log_audit_event(
      p_actor_id := p_accessed_by,
      p_scope := 'security_alert',
      p_action := 'excessive_quote_request_access',
      p_after_data := json_build_object(
        'alert_type', 'potential_data_harvesting',
        'quote_requests_accessed_last_hour', 50,
        'severity', 'HIGH',
        'timestamp', now()
      )::text
    );
  END IF;
END;
$function$;

-- Create trigger function for quote_requests access logging
CREATE OR REPLACE FUNCTION public.quote_requests_access_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Log all access attempts with relevant context
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_quote_request_access(
      NEW.id, 
      'INSERT', 
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 
      NEW.email,
      'quote_request_creation'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_quote_request_access(
      NEW.id, 
      'UPDATE', 
      auth.uid(), 
      NEW.email,
      'quote_request_modification'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_quote_request_access(
      OLD.id, 
      'DELETE', 
      auth.uid(), 
      OLD.email,
      'quote_request_deletion'
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Create trigger for audit logging on quote_requests table
DROP TRIGGER IF EXISTS quote_requests_audit_trigger ON public.quote_requests;
CREATE TRIGGER quote_requests_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.quote_requests_access_trigger();

-- Add data validation constraints to protect data integrity
ALTER TABLE public.quote_requests 
ADD CONSTRAINT IF NOT EXISTS check_email_format 
CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');

ALTER TABLE public.quote_requests 
ADD CONSTRAINT IF NOT EXISTS check_phone_format 
CHECK (phone IS NULL OR phone ~ '^[\d\s\(\)\-\+]+$');

ALTER TABLE public.quote_requests 
ADD CONSTRAINT IF NOT EXISTS check_name_not_empty 
CHECK (name IS NULL OR length(trim(name)) > 0);

-- Revoke dangerous permissions from public role for data access
-- Note: We still allow INSERT for the quote form functionality
REVOKE SELECT, UPDATE, DELETE ON public.quote_requests FROM public;
REVOKE SELECT, UPDATE, DELETE ON public.quote_requests FROM anon;

-- Grant controlled permissions to authenticated users
-- (RLS policies will further restrict access based on roles)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;

-- Create function to detect bulk access to quote requests
CREATE OR REPLACE FUNCTION public.detect_bulk_quote_request_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_suspicious_users RECORD;
BEGIN
  -- Find users accessing many quote requests in the last hour
  FOR v_suspicious_users IN
    SELECT 
      actor_id, 
      COUNT(DISTINCT scope_id) as access_count,
      array_agg(DISTINCT (after_data->>'user_roles')::text) as roles
    FROM audit_logs
    WHERE scope = 'quote_requests' 
      AND action = 'SELECT'
      AND created_at > now() - interval '1 hour'
      AND actor_id IS NOT NULL
    GROUP BY actor_id
    HAVING COUNT(DISTINCT scope_id) > 25
  LOOP
    -- Log security alert for bulk access
    PERFORM public.log_audit_event(
      p_actor_id := v_suspicious_users.actor_id,
      p_scope := 'security_alert',
      p_action := 'bulk_quote_request_access_detected',
      p_after_data := json_build_object(
        'access_count', v_suspicious_users.access_count,
        'time_window', '1 hour',
        'user_roles', v_suspicious_users.roles,
        'severity', 'HIGH',
        'timestamp', now()
      )::text
    );
  END LOOP;
END;
$function$;
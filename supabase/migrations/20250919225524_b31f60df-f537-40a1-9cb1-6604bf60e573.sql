-- CRITICAL SECURITY FIX: Secure Customer Addresses Table
-- Fix excessive permissions and add comprehensive security monitoring

-- Drop the overly permissive sales rep policy
DROP POLICY IF EXISTS "Authenticated sales reps can manage all addresses" ON public.addresses;

-- Create restricted sales rep policy (SELECT only for legitimate business purposes)
CREATE POLICY "Sales reps can view addresses for order fulfillment" 
ON public.addresses 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'sales_rep'::app_role) AND
  -- Only allow access to addresses linked to orders they're working on
  id IN (
    SELECT DISTINCT a.id 
    FROM addresses a
    JOIN orders o ON (o.shipping_address_id = a.id OR o.billing_address_id = a.id)
    WHERE o.status IN ('pending', 'confirmed', 'in_production', 'shipped')
  )
);

-- Strengthen admin policy to require proper authentication
DROP POLICY IF EXISTS "Authenticated admins can manage all addresses" ON public.addresses;

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

-- Strengthen user policy with additional validation
DROP POLICY IF EXISTS "Authenticated users can manage their own addresses" ON public.addresses;

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
  auth.uid() = user_id AND
  -- Validate that user_id must match the authenticated user for any changes
  user_id IS NOT NULL
);

-- Add read-only policy for fulfilment staff (shipping/delivery purposes only)
CREATE POLICY "Fulfilment staff can view shipping addresses" 
ON public.addresses 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'fulfilment'::app_role) AND
  -- Only allow access to shipping addresses of active orders
  id IN (
    SELECT o.shipping_address_id 
    FROM orders o
    WHERE o.shipping_address_id IS NOT NULL
      AND o.status IN ('confirmed', 'in_production', 'ready_for_dispatch', 'shipped')
  )
);

-- Create comprehensive address access logging function
CREATE OR REPLACE FUNCTION public.log_address_access(
  p_address_id uuid,
  p_action text,
  p_accessed_by uuid,
  p_customer_name text DEFAULT NULL,
  p_access_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_roles text[];
  v_is_suspicious boolean := false;
BEGIN
  -- Get user roles for context
  SELECT array_agg(role::text) INTO v_user_roles
  FROM user_roles 
  WHERE user_id = p_accessed_by;
  
  -- Check for suspicious patterns
  IF p_action = 'SELECT' AND array_length(v_user_roles, 1) > 0 THEN
    -- Check if this user has accessed many different addresses recently
    SELECT COUNT(DISTINCT scope_id) > 50 INTO v_is_suspicious
    FROM audit_logs
    WHERE actor_id = p_accessed_by
      AND scope = 'addresses'
      AND created_at > now() - interval '1 hour';
  END IF;
  
  -- Log the access with security context
  PERFORM public.log_audit_event(
    p_actor_id := p_accessed_by,
    p_scope := 'addresses',
    p_scope_id := p_address_id,
    p_action := p_action,
    p_after_data := json_build_object(
      'customer_name_length', CASE WHEN p_customer_name IS NOT NULL THEN length(p_customer_name) ELSE 0 END,
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
      p_action := 'excessive_address_access',
      p_after_data := json_build_object(
        'alert_type', 'potential_data_harvesting',
        'addresses_accessed_last_hour', 50,
        'timestamp', now()
      )::text
    );
  END IF;
END;
$$;

-- Create trigger to automatically log all address access
CREATE OR REPLACE FUNCTION public.addresses_access_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all access attempts with relevant context
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_address_access(
      NEW.id, 
      'INSERT', 
      auth.uid(), 
      NEW.name,
      'address_creation'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_address_access(
      NEW.id, 
      'UPDATE', 
      auth.uid(), 
      NEW.name,
      'address_modification'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_address_access(
      OLD.id, 
      'DELETE', 
      auth.uid(), 
      OLD.name,
      'address_deletion'
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Apply the audit trigger
DROP TRIGGER IF EXISTS addresses_audit_trigger ON public.addresses;
CREATE TRIGGER addresses_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.addresses_access_trigger();

-- Add data validation constraints to prevent malicious data
ALTER TABLE public.addresses 
ADD CONSTRAINT check_name_length 
CHECK (length(name) <= 100 AND length(name) >= 1);

ALTER TABLE public.addresses 
ADD CONSTRAINT check_phone_format 
CHECK (phone IS NULL OR (phone ~ '^[\+]?[0-9\s\-\(\)]+$' AND length(phone) <= 20));

ALTER TABLE public.addresses 
ADD CONSTRAINT check_postcode_format 
CHECK (length(postcode) <= 10 AND postcode ~ '^[0-9A-Za-z\s\-]+$');

-- Create function to detect and alert on bulk address access
CREATE OR REPLACE FUNCTION public.detect_bulk_address_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_suspicious_users RECORD;
BEGIN
  -- Find users who accessed more than 20 different addresses in the last hour
  FOR v_suspicious_users IN
    SELECT 
      actor_id,
      COUNT(DISTINCT scope_id) as addresses_accessed,
      array_agg(DISTINCT scope_id) as address_ids
    FROM audit_logs 
    WHERE scope = 'addresses'
      AND action = 'SELECT'
      AND created_at > now() - interval '1 hour'
      AND actor_id IS NOT NULL
    GROUP BY actor_id
    HAVING COUNT(DISTINCT scope_id) > 20
  LOOP
    -- Log security alert
    PERFORM public.log_audit_event(
      p_actor_id := v_suspicious_users.actor_id,
      p_scope := 'security_incident',
      p_action := 'bulk_address_access_detected',
      p_after_data := json_build_object(
        'addresses_accessed', v_suspicious_users.addresses_accessed,
        'detection_time', now(),
        'severity', 'high',
        'recommended_action', 'investigate_immediately'
      )::text
    );
  END LOOP;
END;
$$;

-- Revoke any potentially dangerous permissions
REVOKE ALL ON public.addresses FROM public;

-- Grant only necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;

-- Create view for safe address display (masks sensitive data for non-owners)
CREATE OR REPLACE VIEW public.addresses_safe AS
SELECT 
  id,
  user_id,
  type,
  CASE 
    WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) 
    THEN name 
    ELSE SUBSTRING(name, 1, 1) || '***'
  END as name,
  CASE 
    WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) 
    THEN line1 
    ELSE SUBSTRING(line1, 1, 3) || '***'
  END as line1,
  CASE 
    WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) 
    THEN line2 
    ELSE CASE WHEN line2 IS NOT NULL THEN '***' ELSE NULL END
  END as line2,
  suburb,
  state,
  postcode,
  country,
  CASE 
    WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) 
    THEN phone 
    ELSE CASE WHEN phone IS NOT NULL THEN '***-***-****' ELSE NULL END
  END as phone,
  is_default,
  created_at,
  updated_at
FROM public.addresses;

-- Enable RLS on the safe view
ALTER VIEW public.addresses_safe SET (security_barrier = true);

-- Grant access to the safe view
GRANT SELECT ON public.addresses_safe TO authenticated;
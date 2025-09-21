-- Security Fix: Add explicit public access denial policies for enhanced security
-- This provides defense in depth for the addresses table

-- Add a restrictive policy to explicitly deny public access to addresses table
CREATE POLICY "Deny public access to addresses" ON public.addresses
AS RESTRICTIVE
FOR ALL
TO public
USING (false);

-- Add additional security audit logging for address access
CREATE OR REPLACE FUNCTION public.enhanced_address_security_check()
RETURNS trigger AS $$
BEGIN
  -- Log any attempt to access addresses without proper authentication
  IF auth.uid() IS NULL THEN
    PERFORM public.log_audit_event(
      p_actor_id := NULL,
      p_scope := 'security_violation',
      p_action := 'unauthorized_address_access_attempt',
      p_after_data := json_build_object(
        'table', 'addresses',
        'attempted_operation', TG_OP,
        'timestamp', now(),
        'severity', 'HIGH'
      )::text
    );
    -- Deny access
    RETURN NULL;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for enhanced security monitoring
DROP TRIGGER IF EXISTS enhanced_address_security_trigger ON public.addresses;
CREATE TRIGGER enhanced_address_security_trigger
  BEFORE SELECT OR INSERT OR UPDATE OR DELETE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_address_security_check();

-- Ensure proper indexing for security queries (performance optimization for RLS)
CREATE INDEX IF NOT EXISTS idx_addresses_user_id_security ON public.addresses(user_id) WHERE user_id IS NOT NULL;

-- Update existing user policy to be more explicit about NULL checks
DROP POLICY IF EXISTS "Authenticated users can manage their own addresses" ON public.addresses;
CREATE POLICY "Authenticated users can manage their own addresses" 
ON public.addresses
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id AND user_id IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id AND user_id IS NOT NULL);

-- Log the security enhancement
SELECT public.log_audit_event(
  p_actor_id := NULL,
  p_scope := 'security_enhancement',
  p_action := 'addresses_table_security_hardened',
  p_after_data := json_build_object(
    'enhancement_type', 'restrictive_public_access_policy',
    'table', 'addresses',
    'timestamp', now(),
    'applied_by', 'security_review'
  )::text
);
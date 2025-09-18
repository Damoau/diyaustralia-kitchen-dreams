-- Continue fixing security vulnerabilities - invoices and admin_sessions tables

-- FIX INVOICES TABLE POLICIES
-- Drop existing policies and recreate with proper authentication
DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view their order invoices" ON public.invoices;

-- Ensure RLS is enabled
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated admins can manage all invoices" 
ON public.invoices 
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

CREATE POLICY "Authenticated users can view their order invoices" 
ON public.invoices 
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  order_id IN (
    SELECT orders.id 
    FROM orders 
    WHERE orders.user_id = auth.uid()
  )
);

-- FIX ADMIN_SESSIONS TABLE POLICIES
-- Drop existing policies and recreate with stricter authentication
DROP POLICY IF EXISTS "Admin users can manage their own sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Super admins can view all admin sessions" ON public.admin_sessions;

-- Ensure RLS is enabled
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated admin users can manage their own sessions" 
ON public.admin_sessions 
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id AND 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated super admins can view all admin sessions" 
ON public.admin_sessions 
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add audit logging for all access to sensitive customer data
CREATE OR REPLACE FUNCTION public.audit_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive customer data
  IF TG_TABLE_NAME IN ('addresses', 'contacts', 'invoices', 'admin_sessions') THEN
    PERFORM public.log_audit_event(
      p_actor_id := auth.uid(),
      p_scope := TG_TABLE_NAME,
      p_scope_id := COALESCE(NEW.id, OLD.id),
      p_action := TG_OP,
      p_before_data := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::text ELSE NULL END,
      p_after_data := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::text ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create audit triggers for sensitive tables
CREATE TRIGGER audit_addresses_access
  AFTER INSERT OR UPDATE OR DELETE
  ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sensitive_data_access();

CREATE TRIGGER audit_contacts_access
  AFTER INSERT OR UPDATE OR DELETE
  ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sensitive_data_access();

CREATE TRIGGER audit_invoices_access
  AFTER INSERT OR UPDATE OR DELETE
  ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sensitive_data_access();

CREATE TRIGGER audit_admin_sessions_access
  AFTER INSERT OR UPDATE OR DELETE
  ON public.admin_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sensitive_data_access();
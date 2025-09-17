-- Fix security vulnerability in quote_requests table
-- Drop existing policies and recreate with more explicit security

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Admins can view all quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Admins can update quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Admins can delete quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Anyone can submit quote requests" ON public.quote_requests;

-- Ensure RLS is enabled
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Create new restrictive policies with explicit security
-- Only authenticated admin users can view quote requests
CREATE POLICY "Admin users can view quote requests" 
ON public.quote_requests 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only authenticated admin users can update quote requests
CREATE POLICY "Admin users can update quote requests" 
ON public.quote_requests 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only authenticated admin users can delete quote requests
CREATE POLICY "Admin users can delete quote requests" 
ON public.quote_requests 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow public quote submissions (for the contact form)
CREATE POLICY "Allow public quote submissions" 
ON public.quote_requests 
FOR INSERT 
WITH CHECK (true);

-- Add audit logging trigger for quote requests access
CREATE OR REPLACE FUNCTION public.audit_quote_requests_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to quote requests for security monitoring
  PERFORM public.log_audit_event(
    p_actor_id := auth.uid(),
    p_scope := 'quote_requests',
    p_scope_id := COALESCE(NEW.id, OLD.id),
    p_action := TG_OP,
    p_before_data := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::text ELSE NULL END,
    p_after_data := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::text ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create audit trigger for quote requests
DROP TRIGGER IF EXISTS audit_quote_requests_trigger ON public.quote_requests;
CREATE TRIGGER audit_quote_requests_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_quote_requests_access();
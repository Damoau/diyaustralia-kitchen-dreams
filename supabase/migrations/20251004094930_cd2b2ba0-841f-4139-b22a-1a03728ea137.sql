-- Phase 1: Critical Security Fixes for RLS Policies
-- Fix 1: Restrict checkouts table anonymous access

-- Drop the overly permissive anonymous policy
DROP POLICY IF EXISTS "Anonymous users can manage checkouts by session_id" ON public.checkouts;

-- Create more restrictive policies for anonymous users
-- Anonymous users can only INSERT their own checkouts
CREATE POLICY "Anonymous users can create checkouts"
ON public.checkouts
FOR INSERT
TO anon
WITH CHECK (
  auth.uid() IS NULL 
  AND session_id IS NOT NULL 
  AND session_id <> ''
);

-- Anonymous users can only SELECT their own recent checkouts (within 2 hours)
CREATE POLICY "Anonymous users can view own recent checkouts"
ON public.checkouts
FOR SELECT
TO anon
USING (
  auth.uid() IS NULL 
  AND session_id IS NOT NULL 
  AND session_id <> ''
  AND expires_at > now()
);

-- Anonymous users can only UPDATE their own recent checkouts
CREATE POLICY "Anonymous users can update own recent checkouts"
ON public.checkouts
FOR UPDATE
TO anon
USING (
  auth.uid() IS NULL 
  AND session_id IS NOT NULL 
  AND session_id <> ''
  AND expires_at > now()
)
WITH CHECK (
  auth.uid() IS NULL 
  AND session_id IS NOT NULL 
  AND session_id <> ''
  AND expires_at > now()
);

-- Fix 2: Restrict contacts table sales rep access
-- Drop the overly permissive sales rep policy
DROP POLICY IF EXISTS "Authenticated sales reps can manage all contacts" ON public.contacts;

-- Create more restrictive policy - sales reps can only view contacts, not manage all
CREATE POLICY "Sales reps can view all contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'sales_rep'::app_role)
);

-- Sales reps can insert new contacts
CREATE POLICY "Sales reps can create contacts"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'sales_rep'::app_role)
);

-- Sales reps can update contacts (but not delete)
CREATE POLICY "Sales reps can update contacts"
ON public.contacts
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'sales_rep'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'sales_rep'::app_role)
);

-- Add audit logging trigger for checkouts table to track all access
CREATE OR REPLACE FUNCTION public.audit_checkouts_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log all access to checkouts for security monitoring
  PERFORM public.log_audit_event(
    p_actor_id := auth.uid(),
    p_scope := 'checkouts',
    p_scope_id := COALESCE(NEW.id, OLD.id),
    p_action := TG_OP,
    p_before_data := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::text ELSE NULL END,
    p_after_data := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::text ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for checkouts audit logging
DROP TRIGGER IF EXISTS audit_checkouts_trigger ON public.checkouts;
CREATE TRIGGER audit_checkouts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.checkouts
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_checkouts_access();
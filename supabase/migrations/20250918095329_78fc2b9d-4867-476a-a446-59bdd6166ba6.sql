-- SECURITY FIXES - Phase 1: Fix Critical Quote Requests Data Exposure

-- 1. DROP ALL EXISTING CONFLICTING POLICIES ON QUOTE_REQUESTS
DROP POLICY IF EXISTS "Admin users can delete quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Admin users can update quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Admin users can view quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Allow public quote submissions" ON public.quote_requests;
DROP POLICY IF EXISTS "Anyone can submit quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Only authenticated admins can delete quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Only authenticated admins can manage quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Only authenticated admins can view quote requests" ON public.quote_requests;

-- 2. CREATE CLEAN, SECURE RLS POLICIES FOR QUOTE_REQUESTS

-- Allow public to submit quote requests (for contact forms)
CREATE POLICY "Public can submit quote requests"
ON public.quote_requests
FOR INSERT
TO public
WITH CHECK (true);

-- Only authenticated admin users can view quote requests
CREATE POLICY "Admins can view quote requests"
ON public.quote_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only authenticated admin users can update quote requests
CREATE POLICY "Admins can update quote requests"
ON public.quote_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only authenticated admin users can delete quote requests
CREATE POLICY "Admins can delete quote requests"
ON public.quote_requests
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- 3. ADD AUDIT TRIGGER FOR QUOTE REQUESTS ACCESS
DROP TRIGGER IF EXISTS audit_quote_requests_access ON public.quote_requests;
CREATE TRIGGER audit_quote_requests_access
  AFTER INSERT OR UPDATE OR DELETE
  ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_quote_requests_access();
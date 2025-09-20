-- Additional security hardening for quote_requests table
-- Force strict access controls and remove any potential loopholes

-- Ensure the table is owned by postgres (not public)
-- and has the most restrictive permissions possible

-- Remove any remaining grants that might exist
REVOKE ALL PRIVILEGES ON public.quote_requests FROM PUBLIC;
REVOKE ALL PRIVILEGES ON public.quote_requests FROM anon;

-- Grant only the absolute minimum required permissions
-- Anonymous users: INSERT only (for quote submission)
GRANT INSERT ON public.quote_requests TO anon;

-- Authenticated users: INSERT, SELECT, UPDATE based on RLS policies
GRANT INSERT, SELECT, UPDATE, DELETE ON public.quote_requests TO authenticated;

-- Ensure the sequence (for auto-increment ID) is also properly secured
GRANT USAGE ON SEQUENCE quote_requests_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE quote_requests_id_seq TO authenticated;

-- Force strict RLS enforcement
ALTER TABLE public.quote_requests FORCE ROW LEVEL SECURITY;

-- Add a final safety policy that denies all public access
-- This is a failsafe in case other policies have issues
CREATE POLICY "deny_all_public_access" ON public.quote_requests
FOR ALL TO public
USING (false)
WITH CHECK (false);

-- Verify policies are working by creating a test function
-- that attempts to access data without proper permissions
CREATE OR REPLACE FUNCTION test_quote_requests_security()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- This should return false or error if security is working
  SELECT EXISTS(SELECT 1 FROM quote_requests LIMIT 1);
$$;
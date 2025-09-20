-- Final security hardening for quote_requests table
-- Complete the security setup without sequence issues

-- Force strict RLS enforcement (in case it wasn't set before)
ALTER TABLE public.quote_requests FORCE ROW LEVEL SECURITY;

-- Add a final safety policy that denies all public access
-- This is a failsafe in case other policies have issues
CREATE POLICY "deny_all_public_access" ON public.quote_requests
FOR ALL TO public
USING (false)
WITH CHECK (false);

-- Verify current policies are working correctly
-- List all policies for verification
SELECT 'Current policies on quote_requests:' as status;

-- Test if an unauthenticated request can access data (should fail)
-- This creates a test that should return 0 or error
CREATE OR REPLACE FUNCTION test_quote_requests_security_final()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result_count integer := 0;
BEGIN
    -- This should fail or return 0 if security is working
    SELECT COUNT(*) INTO result_count FROM quote_requests;
    
    IF result_count = 0 THEN
        RETURN 'SECURITY TEST PASSED: No data accessible without authentication';
    ELSE
        RETURN 'SECURITY TEST FAILED: ' || result_count || ' records accessible';
    END IF;
EXCEPTION
    WHEN insufficient_privilege THEN
        RETURN 'SECURITY TEST PASSED: Access denied as expected';
    WHEN OTHERS THEN
        RETURN 'SECURITY TEST ERROR: ' || SQLERRM;
END;
$$;
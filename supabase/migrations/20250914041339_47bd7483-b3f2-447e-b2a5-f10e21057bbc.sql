-- Enhance RLS policies for the profiles table to address security concerns
-- Drop existing policies to recreate them with more explicit security

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create more comprehensive and explicit RLS policies

-- SELECT: Users can only view their own profile data
CREATE POLICY "Users can only view their own profile" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- INSERT: Users can only create their own profile 
CREATE POLICY "Users can only insert their own profile" 
ON public.profiles
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- UPDATE: Users can only update their own profile
CREATE POLICY "Users can only update their own profile" 
ON public.profiles
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- DELETE: Explicitly deny DELETE operations to all users (profiles should not be deleted)
CREATE POLICY "Profiles cannot be deleted" 
ON public.profiles
FOR DELETE 
TO authenticated
USING (false);

-- Add a comment to document the security approach
COMMENT ON TABLE public.profiles IS 'User profiles with strict RLS policies. Users can only access their own profile data. Email addresses and other PII are protected by user_id-based access control.';
-- Fix critical security vulnerabilities by ensuring proper RLS policies

-- Ensure profiles table exists and has proper RLS
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create secure RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Update verification_tokens policies to be more restrictive
DROP POLICY IF EXISTS "Users can manage their own verification tokens" ON public.verification_tokens;
DROP POLICY IF EXISTS "Admins can manage all verification tokens" ON public.verification_tokens;

-- More restrictive verification token policies
CREATE POLICY "Users can view own verification tokens" ON public.verification_tokens
    FOR SELECT USING (auth.uid() = user_id OR email = auth.email());

CREATE POLICY "Users can insert own verification tokens" ON public.verification_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id OR email = auth.email());

CREATE POLICY "Admins can manage all verification tokens" ON public.verification_tokens
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Fix function search_path issues for security
-- Update all functions to have proper search_path set to 'public'
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;

-- Update other critical functions
CREATE OR REPLACE FUNCTION public.auto_archive_old_carts()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER := 0;
BEGIN
  -- Archive carts older than 30 days without activity (except primary carts)
  UPDATE public.carts 
  SET 
    lifecycle_state = 'archived',
    auto_archived_at = now(),
    archive_reason = 'Auto-archived due to inactivity (30+ days)',
    is_primary = false,
    updated_at = now()
  WHERE 
    lifecycle_state = 'active'
    AND is_primary = false
    AND last_activity_at < (now() - interval '30 days')
    AND (SELECT COUNT(*) FROM cart_items WHERE cart_id = carts.id) = 0;
    
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Expire carts older than 90 days
  UPDATE public.carts 
  SET 
    lifecycle_state = 'expired',
    expiry_date = now(),
    updated_at = now()
  WHERE 
    lifecycle_state IN ('archived', 'active')
    AND last_activity_at < (now() - interval '90 days');
    
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;
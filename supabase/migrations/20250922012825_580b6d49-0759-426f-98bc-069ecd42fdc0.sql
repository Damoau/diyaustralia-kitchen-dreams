-- Create a profile for the existing user damianorwin@gmail.com
-- This ensures they can access their quotes immediately

INSERT INTO public.profiles (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'damianorwin@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
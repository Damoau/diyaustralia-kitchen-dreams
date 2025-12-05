INSERT INTO public.user_roles (user_id, role)
VALUES ('c0924da7-06d1-4ceb-96e6-5bb1a9f0c2ba', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
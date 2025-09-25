-- Clean up and fix cabinet_types RLS policies
-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can delete cabinet types" ON public.cabinet_types;
DROP POLICY IF EXISTS "Admins can insert cabinet types" ON public.cabinet_types;
DROP POLICY IF EXISTS "Admins can manage all cabinet types" ON public.cabinet_types;
DROP POLICY IF EXISTS "Admins can update cabinet types" ON public.cabinet_types;
DROP POLICY IF EXISTS "Anyone can view active cabinet types" ON public.cabinet_types;
DROP POLICY IF EXISTS "Anyone can view cabinet types" ON public.cabinet_types;

-- Create clean, simple policies
-- Policy for admins to do everything
CREATE POLICY "Admins can manage all cabinet types" 
ON public.cabinet_types 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy for public to view active cabinet types
CREATE POLICY "Public can view active cabinet types" 
ON public.cabinet_types 
FOR SELECT 
TO public
USING (active = true);
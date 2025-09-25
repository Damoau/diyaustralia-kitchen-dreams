-- Check if cabinet_types table exists and add RLS policies for admins
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cabinet_types') THEN
    
    -- Enable RLS on cabinet_types if not already enabled
    ALTER TABLE public.cabinet_types ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing admin policies if they exist
    DROP POLICY IF EXISTS "Admins can manage all cabinet types" ON public.cabinet_types;
    DROP POLICY IF EXISTS "Anyone can view active cabinet types" ON public.cabinet_types;
    
    -- Create policy for admins to manage all cabinet types
    CREATE POLICY "Admins can manage all cabinet types" 
    ON public.cabinet_types 
    FOR ALL 
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
    
    -- Create policy for public to view active cabinet types
    CREATE POLICY "Anyone can view active cabinet types" 
    ON public.cabinet_types 
    FOR SELECT 
    USING (active = true);
    
    RAISE NOTICE 'RLS policies updated for cabinet_types table';
  ELSE
    RAISE NOTICE 'cabinet_types table does not exist';
  END IF;
END
$$;
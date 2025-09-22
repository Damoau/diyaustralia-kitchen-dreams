-- Update storage policies to work with file upload metadata
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload files" ON storage.objects;

-- Create new policies that work with file uploads
CREATE POLICY "Users can upload to documents bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view files in documents bucket" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.uid() IS NOT NULL
);
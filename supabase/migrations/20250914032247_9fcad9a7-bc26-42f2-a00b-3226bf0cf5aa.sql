-- Add image_url column to door_styles table for cabinet images
ALTER TABLE public.door_styles 
ADD COLUMN image_url TEXT;

-- Create a storage bucket for door style images
INSERT INTO storage.buckets (id, name, public) VALUES ('door-style-images', 'door-style-images', true);

-- Create storage policies for door style images
CREATE POLICY "Door style images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'door-style-images');

CREATE POLICY "Admins can upload door style images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'door-style-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update door style images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'door-style-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete door style images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'door-style-images' AND has_role(auth.uid(), 'admin'::app_role));
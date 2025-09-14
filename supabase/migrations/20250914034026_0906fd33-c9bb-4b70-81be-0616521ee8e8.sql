-- Add image_url column to cabinet_type_finishes table for cabinet+door style specific images
ALTER TABLE cabinet_type_finishes 
ADD COLUMN image_url TEXT;
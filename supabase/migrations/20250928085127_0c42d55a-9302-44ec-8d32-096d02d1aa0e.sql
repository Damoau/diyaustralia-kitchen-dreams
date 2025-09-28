-- Add markup_percentage field to hardware_products table
ALTER TABLE hardware_products 
ADD COLUMN markup_percentage NUMERIC DEFAULT 0 CHECK (markup_percentage >= 0 AND markup_percentage <= 100);
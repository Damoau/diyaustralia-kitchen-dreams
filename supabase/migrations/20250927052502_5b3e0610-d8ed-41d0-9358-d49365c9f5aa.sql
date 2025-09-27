-- Add customer internal notes field to quotes table
ALTER TABLE public.quotes 
ADD COLUMN customer_internal_notes text;
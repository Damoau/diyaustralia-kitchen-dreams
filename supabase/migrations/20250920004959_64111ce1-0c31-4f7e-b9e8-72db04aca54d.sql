-- Add SEO fields to cabinet_types table
ALTER TABLE public.cabinet_types 
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT,
ADD COLUMN IF NOT EXISTS url_slug TEXT;

-- Create index on url_slug for performance
CREATE INDEX IF NOT EXISTS idx_cabinet_types_url_slug ON public.cabinet_types(url_slug);

-- Add unique constraint on url_slug to prevent duplicates
ALTER TABLE public.cabinet_types 
ADD CONSTRAINT unique_cabinet_types_url_slug UNIQUE (url_slug);
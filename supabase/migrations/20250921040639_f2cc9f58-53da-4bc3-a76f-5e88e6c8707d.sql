-- Remove duplicates by keeping only the first occurrence of each category
DELETE FROM public.unified_categories 
WHERE id NOT IN (
  SELECT DISTINCT ON (name, level, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)) id
  FROM public.unified_categories
  ORDER BY name, level, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), created_at
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.unified_categories 
ADD CONSTRAINT unique_category_per_level_parent 
UNIQUE (name, level, parent_id);

-- Handle the case where parent_id is NULL - need separate constraint
DROP CONSTRAINT IF EXISTS unique_category_per_level_parent;

-- Create partial unique indexes for different scenarios
CREATE UNIQUE INDEX IF NOT EXISTS idx_unified_categories_unique_with_parent 
ON public.unified_categories (name, level, parent_id) 
WHERE parent_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unified_categories_unique_no_parent 
ON public.unified_categories (name, level) 
WHERE parent_id IS NULL;
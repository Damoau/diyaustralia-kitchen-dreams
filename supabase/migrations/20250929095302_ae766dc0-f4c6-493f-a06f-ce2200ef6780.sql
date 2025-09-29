-- Step 1: Fix trailing spaces in category names
UPDATE unified_categories 
SET name = TRIM(name), 
    display_name = TRIM(display_name),
    updated_at = now()
WHERE name != TRIM(name) OR display_name != TRIM(display_name);

-- Step 2: Create index to improve category lookup performance
CREATE INDEX IF NOT EXISTS idx_unified_categories_lookup 
ON unified_categories(name, level, parent_id, active);
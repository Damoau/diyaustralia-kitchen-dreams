-- Add sort_order to colors table to support default color ordering
ALTER TABLE colors ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create index for better performance when ordering colors
CREATE INDEX IF NOT EXISTS idx_colors_door_style_sort ON colors(door_style_id, sort_order, active);

-- Update existing colors to have proper sort order (first color gets sort_order 0)
UPDATE colors SET sort_order = subquery.row_num - 1
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY door_style_id ORDER BY name) as row_num
    FROM colors 
    WHERE active = true
) AS subquery
WHERE colors.id = subquery.id;
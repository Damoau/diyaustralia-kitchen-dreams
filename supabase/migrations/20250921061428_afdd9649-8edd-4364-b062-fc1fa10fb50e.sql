-- Set some rooms as inactive to demonstrate the hide functionality
-- This is just for testing - you can change these back later
UPDATE unified_categories 
SET active = false 
WHERE name IN ('wardrobe', 'outdoor-kitchen') AND level = 1;
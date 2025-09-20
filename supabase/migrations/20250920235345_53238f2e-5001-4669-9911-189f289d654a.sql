-- Update existing cabinet types to associate them with room categories
-- First, let's get the room category IDs
DO $$
DECLARE
    kitchen_id UUID;
    laundry_id UUID;
    vanity_id UUID;
    wardrobe_id UUID;
    outdoor_id UUID;
BEGIN
    -- Get room category IDs
    SELECT id INTO kitchen_id FROM room_categories WHERE name = 'kitchen';
    SELECT id INTO laundry_id FROM room_categories WHERE name = 'laundry';
    SELECT id INTO vanity_id FROM room_categories WHERE name = 'vanity';
    SELECT id INTO wardrobe_id FROM room_categories WHERE name = 'wardrobe';
    SELECT id INTO outdoor_id FROM room_categories WHERE name = 'outdoor-kitchen';
    
    -- Update cabinet types based on their current categories
    -- Kitchen cabinets
    UPDATE cabinet_types 
    SET room_category_id = kitchen_id
    WHERE category IN ('base', 'wall', 'tall', 'pantry', 'specialty');
    
    -- For demo purposes, let's create some laundry cabinets
    INSERT INTO cabinet_types (
        name, category, room_category_id, default_width_mm, default_height_mm, default_depth_mm,
        short_description, door_count, drawer_count, active
    ) VALUES 
    ('Laundry Base Cabinet', 'base', laundry_id, 600, 720, 560, 'Perfect for laundry room storage with adjustable shelves', 2, 0, true),
    ('Laundry Wall Cabinet', 'wall', laundry_id, 600, 720, 320, 'Wall-mounted storage for laundry essentials', 2, 0, true),
    ('Broom Cabinet', 'broom', laundry_id, 400, 2100, 560, 'Tall cabinet designed for broom and utility storage', 1, 0, true),
    ('Laundry Storage Tower', 'storage', laundry_id, 400, 2100, 560, 'Full-height storage solution', 4, 2, true);
    
    -- For demo purposes, let's create some vanity cabinets
    INSERT INTO cabinet_types (
        name, category, room_category_id, default_width_mm, default_height_mm, default_depth_mm,
        short_description, door_count, drawer_count, active
    ) VALUES 
    ('Vanity Base 900mm', 'base', vanity_id, 900, 720, 460, 'Spacious vanity base with soft-close drawers', 0, 3, true),
    ('Vanity Wall Cabinet', 'wall', vanity_id, 600, 720, 150, 'Shallow wall cabinet for bathroom storage', 1, 0, true),
    ('Mirror Cabinet', 'mirrors', vanity_id, 750, 900, 120, 'Medicine cabinet with integrated mirror', 1, 0, true),
    ('Vanity Storage Unit', 'storage', vanity_id, 300, 1800, 320, 'Tall narrow storage for bathroom essentials', 1, 2, true);
END
$$;
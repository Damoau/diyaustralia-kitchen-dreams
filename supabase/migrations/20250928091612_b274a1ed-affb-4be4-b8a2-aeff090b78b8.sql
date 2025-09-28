-- Add hinge sides configuration for cabinet types
-- This adds a "Hinge Sides" dropdown option with common hinge configurations

-- Insert the main hinge sides option (check if it already exists first)
DO $$
DECLARE
    option_uuid uuid;
    option_exists boolean := false;
BEGIN
    -- Check if option already exists
    SELECT EXISTS(
        SELECT 1 FROM cabinet_product_options 
        WHERE cabinet_type_id = '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c' 
        AND option_name = 'hinge_sides'
    ) INTO option_exists;
    
    -- Insert the option if it doesn't exist
    IF NOT option_exists THEN
        INSERT INTO cabinet_product_options (
            cabinet_type_id,
            option_name,
            display_name,
            option_type,
            description,
            required,
            display_order,
            active
        ) VALUES (
            '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c',
            'hinge_sides',
            'Hinge Sides',
            'select',
            'Select which side each door opens from (Left or Right)',
            true,
            1,
            true
        );
    END IF;
    
    -- Get the option ID
    SELECT id INTO option_uuid 
    FROM cabinet_product_options 
    WHERE cabinet_type_id = '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c' 
    AND option_name = 'hinge_sides';
    
    -- Insert option values if the option exists and values don't already exist
    IF option_uuid IS NOT NULL THEN
        -- Insert hinge side options
        INSERT INTO cabinet_option_values (
            cabinet_option_id,
            value,
            display_text,
            display_order,
            active,
            price_adjustment
        ) 
        SELECT option_uuid, 'left_side', 'Left Side', 0, true, 0
        WHERE NOT EXISTS (SELECT 1 FROM cabinet_option_values WHERE cabinet_option_id = option_uuid AND value = 'left_side')
        
        UNION ALL
        
        SELECT option_uuid, 'right_side', 'Right Side', 1, true, 0
        WHERE NOT EXISTS (SELECT 1 FROM cabinet_option_values WHERE cabinet_option_id = option_uuid AND value = 'right_side')
        
        UNION ALL
        
        SELECT option_uuid, 'left_left_right', 'Left, Left, Right', 2, true, 0
        WHERE NOT EXISTS (SELECT 1 FROM cabinet_option_values WHERE cabinet_option_id = option_uuid AND value = 'left_left_right')
        
        UNION ALL
        
        SELECT option_uuid, 'right_right_left', 'Right, Right, Left', 3, true, 0
        WHERE NOT EXISTS (SELECT 1 FROM cabinet_option_values WHERE cabinet_option_id = option_uuid AND value = 'right_right_left')
        
        UNION ALL
        
        SELECT option_uuid, 'left_right_left', 'Left, Right, Left', 4, true, 0
        WHERE NOT EXISTS (SELECT 1 FROM cabinet_option_values WHERE cabinet_option_id = option_uuid AND value = 'left_right_left')
        
        UNION ALL
        
        SELECT option_uuid, 'right_left_right', 'Right, Left, Right', 5, true, 0
        WHERE NOT EXISTS (SELECT 1 FROM cabinet_option_values WHERE cabinet_option_id = option_uuid AND value = 'right_left_right');
    END IF;
END $$;
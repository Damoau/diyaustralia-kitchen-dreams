-- Set up hardware requirements for "4 door base" cabinet
-- Get the cabinet type ID for "4 door base"
DO $$
DECLARE
    cabinet_type_uuid UUID;
    hinge_type_uuid UUID;
    handle_type_uuid UUID;
BEGIN
    -- Get cabinet type ID
    SELECT id INTO cabinet_type_uuid FROM cabinet_types WHERE name = '4 door base' LIMIT 1;
    
    -- Get hardware type IDs
    SELECT id INTO hinge_type_uuid FROM hardware_types WHERE name = 'Soft Close Hinges' LIMIT 1;
    SELECT id INTO handle_type_uuid FROM hardware_types WHERE name = 'Cabinet Handles' LIMIT 1;
    
    -- Only proceed if we found the cabinet type
    IF cabinet_type_uuid IS NOT NULL THEN
        -- Insert hardware requirements for 4 door base
        INSERT INTO cabinet_hardware_requirements (cabinet_type_id, hardware_type_id, unit_scope, units_per_scope, notes, active)
        VALUES 
            (cabinet_type_uuid, hinge_type_uuid, 'per_door', 2, '2 hinges per door', true),
            (cabinet_type_uuid, handle_type_uuid, 'per_door', 1, '1 handle per door', true)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Hardware requirements created for "4 door base" cabinet';
    ELSE
        RAISE NOTICE 'Cabinet type "4 door base" not found';
    END IF;
END $$;
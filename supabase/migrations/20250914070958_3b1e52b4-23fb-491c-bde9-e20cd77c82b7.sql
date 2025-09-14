-- Create cabinet parts for 1 Door Base Cabinet
INSERT INTO cabinet_parts (cabinet_type_id, part_name, width_formula, height_formula, quantity, is_door, is_hardware)
SELECT 
    '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c',
    'Back',
    'width',
    'height', 
    1,
    false,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM cabinet_parts 
    WHERE cabinet_type_id = '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c' 
    AND part_name = 'Back'
);

INSERT INTO cabinet_parts (cabinet_type_id, part_name, width_formula, height_formula, quantity, is_door, is_hardware)
SELECT 
    '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c',
    'Bottom',
    'width',
    'depth', 
    1,
    false,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM cabinet_parts 
    WHERE cabinet_type_id = '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c' 
    AND part_name = 'Bottom'
);

INSERT INTO cabinet_parts (cabinet_type_id, part_name, width_formula, height_formula, quantity, is_door, is_hardware)
SELECT 
    '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c',
    'Side',
    'depth',
    'height', 
    2,
    false,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM cabinet_parts 
    WHERE cabinet_type_id = '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c' 
    AND part_name = 'Side'
);

INSERT INTO cabinet_parts (cabinet_type_id, part_name, width_formula, height_formula, quantity, is_door, is_hardware)
SELECT 
    '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c',
    'Door',
    'width',
    'height', 
    1,
    true,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM cabinet_parts 
    WHERE cabinet_type_id = '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c' 
    AND part_name = 'Door'
);

-- Create cabinet parts for 2 Door Base Cabinet  
INSERT INTO cabinet_parts (cabinet_type_id, part_name, width_formula, height_formula, quantity, is_door, is_hardware)
SELECT 
    '9d7b99c3-5d93-4130-bfee-f2674e51fcc7',
    'Back',
    'width',
    'height', 
    1,
    false,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM cabinet_parts 
    WHERE cabinet_type_id = '9d7b99c3-5d93-4130-bfee-f2674e51fcc7' 
    AND part_name = 'Back'
);

INSERT INTO cabinet_parts (cabinet_type_id, part_name, width_formula, height_formula, quantity, is_door, is_hardware)
SELECT 
    '9d7b99c3-5d93-4130-bfee-f2674e51fcc7',
    'Bottom',
    'width',
    'depth', 
    1,
    false,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM cabinet_parts 
    WHERE cabinet_type_id = '9d7b99c3-5d93-4130-bfee-f2674e51fcc7' 
    AND part_name = 'Bottom'
);

INSERT INTO cabinet_parts (cabinet_type_id, part_name, width_formula, height_formula, quantity, is_door, is_hardware)
SELECT 
    '9d7b99c3-5d93-4130-bfee-f2674e51fcc7',
    'Side',
    'depth',
    'height', 
    2,
    false,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM cabinet_parts 
    WHERE cabinet_type_id = '9d7b99c3-5d93-4130-bfee-f2674e51fcc7' 
    AND part_name = 'Side'
);

INSERT INTO cabinet_parts (cabinet_type_id, part_name, width_formula, height_formula, quantity, is_door, is_hardware)
SELECT 
    '9d7b99c3-5d93-4130-bfee-f2674e51fcc7',
    'Door',
    'width',
    'height', 
    2,
    true,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM cabinet_parts 
    WHERE cabinet_type_id = '9d7b99c3-5d93-4130-bfee-f2674e51fcc7' 
    AND part_name = 'Door'
);

-- Create cabinet parts for Pot Drawer Base (drawer cabinet)
INSERT INTO cabinet_parts (cabinet_type_id, part_name, width_formula, height_formula, quantity, is_door, is_hardware)
SELECT 
    '3d50dff2-6be5-4317-a954-2b7d27cfb5d7',
    'Back',
    'width',
    'height', 
    1,
    false,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM cabinet_parts 
    WHERE cabinet_type_id = '3d50dff2-6be5-4317-a954-2b7d27cfb5d7' 
    AND part_name = 'Back'
);

INSERT INTO cabinet_parts (cabinet_type_id, part_name, width_formula, height_formula, quantity, is_door, is_hardware)
SELECT 
    '3d50dff2-6be5-4317-a954-2b7d27cfb5d7',
    'Bottom',
    'width',
    'depth', 
    1,
    false,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM cabinet_parts 
    WHERE cabinet_type_id = '3d50dff2-6be5-4317-a954-2b7d27cfb5d7' 
    AND part_name = 'Bottom'
);

INSERT INTO cabinet_parts (cabinet_type_id, part_name, width_formula, height_formula, quantity, is_door, is_hardware)
SELECT 
    '3d50dff2-6be5-4317-a954-2b7d27cfb5d7',
    'Side',
    'depth',
    'height', 
    2,
    false,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM cabinet_parts 
    WHERE cabinet_type_id = '3d50dff2-6be5-4317-a954-2b7d27cfb5d7' 
    AND part_name = 'Side'
);

INSERT INTO cabinet_parts (cabinet_type_id, part_name, width_formula, height_formula, quantity, is_door, is_hardware)
SELECT 
    '3d50dff2-6be5-4317-a954-2b7d27cfb5d7',
    'Drawer Front',
    'width',
    'height', 
    3,
    true,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM cabinet_parts 
    WHERE cabinet_type_id = '3d50dff2-6be5-4317-a954-2b7d27cfb5d7' 
    AND part_name = 'Drawer Front'
);
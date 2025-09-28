-- Add hinge sides configuration for cabinet types
-- This adds a "Hinge Sides" dropdown option with common hinge configurations

-- Insert the main hinge sides option
INSERT INTO cabinet_product_options (
    cabinet_type_id,
    option_name,
    display_name,
    option_type,
    description,
    required,
    display_order,
    active
) 
SELECT 
    '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c',
    'hinge_sides',
    'Hinge Sides',
    'select',
    'Select which side each door opens from (Left or Right)',
    true,
    1,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM cabinet_product_options 
    WHERE cabinet_type_id = '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c' 
    AND option_name = 'hinge_sides'
);

-- Insert option values
INSERT INTO cabinet_option_values (
    cabinet_option_id,
    value,
    display_text,
    display_order,
    active,
    price_adjustment
)
SELECT 
    cpo.id,
    values.value,
    values.display_text,
    values.display_order,
    values.active,
    values.price_adjustment
FROM cabinet_product_options cpo
CROSS JOIN (
    VALUES 
    ('left_side', 'Left Side', 0, true, 0),
    ('right_side', 'Right Side', 1, true, 0),
    ('left_left_right', 'Left, Left, Right', 2, true, 0),
    ('right_right_left', 'Right, Right, Left', 3, true, 0),
    ('left_right_left', 'Left, Right, Left', 4, true, 0),
    ('right_left_right', 'Right, Left, Right', 5, true, 0)
) AS values(value, display_text, display_order, active, price_adjustment)
WHERE cpo.cabinet_type_id = '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c'
AND cpo.option_name = 'hinge_sides'
AND NOT EXISTS (
    SELECT 1 FROM cabinet_option_values cov
    WHERE cov.cabinet_option_id = cpo.id
    AND cov.value = values.value
);
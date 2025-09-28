-- Fix the door count for the current cabinet
UPDATE cabinet_types 
SET door_count = 2 
WHERE id = '5e687636-ca15-4634-8b1f-2268d744906b' AND door_count = 0;

-- Create a function to setup door hinge configurations for any cabinet
CREATE OR REPLACE FUNCTION setup_door_hinge_options(p_cabinet_type_id uuid, p_door_count integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_option_id uuid;
  v_combinations text[];
  v_combination text;
  v_display_order integer := 0;
BEGIN
  -- Delete existing hinge configuration options for this cabinet
  DELETE FROM cabinet_product_options 
  WHERE cabinet_type_id = p_cabinet_type_id 
    AND option_name = 'Door Hinge Configuration';
  
  -- Create the hinge configuration option
  INSERT INTO cabinet_product_options (
    cabinet_type_id,
    option_name,
    option_type,
    display_order,
    required,
    description,
    active
  ) VALUES (
    p_cabinet_type_id,
    'Door Hinge Configuration',
    'select',
    0,
    true,
    'Select which side each door opens from (Left or Right)',
    true
  ) RETURNING id INTO v_option_id;
  
  -- Generate all possible combinations based on door count
  IF p_door_count = 1 THEN
    v_combinations := ARRAY['Left', 'Right'];
  ELSIF p_door_count = 2 THEN
    v_combinations := ARRAY['Left-Left', 'Left-Right', 'Right-Left', 'Right-Right'];
  ELSIF p_door_count = 3 THEN
    v_combinations := ARRAY[
      'Left-Left-Left', 'Left-Left-Right', 'Left-Right-Left', 'Left-Right-Right',
      'Right-Left-Left', 'Right-Left-Right', 'Right-Right-Left', 'Right-Right-Right'
    ];
  ELSIF p_door_count = 4 THEN
    v_combinations := ARRAY[
      'Left-Left-Left-Left', 'Left-Left-Left-Right', 'Left-Left-Right-Left', 'Left-Left-Right-Right',
      'Left-Right-Left-Left', 'Left-Right-Left-Right', 'Left-Right-Right-Left', 'Left-Right-Right-Right',
      'Right-Left-Left-Left', 'Right-Left-Left-Right', 'Right-Left-Right-Left', 'Right-Left-Right-Right',
      'Right-Right-Left-Left', 'Right-Right-Left-Right', 'Right-Right-Right-Left', 'Right-Right-Right-Right'
    ];
  ELSE
    -- For more than 4 doors, just add some common patterns
    v_combinations := ARRAY['All Left', 'All Right', 'Alternating (L-R-L-R...)', 'Custom Configuration Required'];
  END IF;
  
  -- Insert option values using correct column name
  FOREACH v_combination IN ARRAY v_combinations
  LOOP
    INSERT INTO cabinet_option_values (
      cabinet_option_id,
      value,
      display_text,
      display_order,
      active
    ) VALUES (
      v_option_id,
      v_combination,
      v_combination,
      v_display_order,
      true
    );
    v_display_order := v_display_order + 1;
  END LOOP;
END;
$$;

-- Setup hinge options for the current cabinet
SELECT setup_door_hinge_options('5e687636-ca15-4634-8b1f-2268d744906b', 2);
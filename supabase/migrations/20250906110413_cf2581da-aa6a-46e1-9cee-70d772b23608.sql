-- Insert hardware requirements for "4 door base" cabinet directly
INSERT INTO cabinet_hardware_requirements (cabinet_type_id, hardware_type_id, unit_scope, units_per_scope, notes, active)
SELECT 
    ct.id as cabinet_type_id,
    ht.id as hardware_type_id,
    'per_door' as unit_scope,
    CASE 
        WHEN ht.name = 'Soft Close Hinges' THEN 2
        WHEN ht.name = 'Cabinet Handles' THEN 1
        ELSE 1
    END as units_per_scope,
    CASE 
        WHEN ht.name = 'Soft Close Hinges' THEN '2 hinges per door'
        WHEN ht.name = 'Cabinet Handles' THEN '1 handle per door'
        ELSE 'Hardware requirement'
    END as notes,
    true as active
FROM cabinet_types ct
CROSS JOIN hardware_types ht
WHERE ct.name = '4 door base' 
  AND ht.name IN ('Soft Close Hinges', 'Cabinet Handles')
  AND ct.active = true 
  AND ht.active = true
ON CONFLICT DO NOTHING;
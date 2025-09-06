-- Check and manually insert hardware requirements if needed
WITH cabinet_info AS (
  SELECT id, name FROM cabinet_types WHERE name = '4 door base'
),
hardware_info AS (
  SELECT id, name FROM hardware_types WHERE name IN ('Soft Close Hinges', 'Cabinet Handles')
)
INSERT INTO cabinet_hardware_requirements (
  cabinet_type_id, 
  hardware_type_id, 
  unit_scope, 
  units_per_scope, 
  notes
)
SELECT 
  c.id,
  h.id,
  'per_door',
  CASE WHEN h.name = 'Soft Close Hinges' THEN 2 ELSE 1 END,
  CASE WHEN h.name = 'Soft Close Hinges' THEN '2 hinges per door' ELSE '1 handle per door' END
FROM cabinet_info c, hardware_info h
WHERE NOT EXISTS (
  SELECT 1 FROM cabinet_hardware_requirements chr 
  WHERE chr.cabinet_type_id = c.id AND chr.hardware_type_id = h.id
);

-- Show what we inserted
SELECT 'Inserted hardware requirements:' as message;
SELECT chr.*, ht.name as hardware_type_name, ct.name as cabinet_name
FROM cabinet_hardware_requirements chr
JOIN hardware_types ht ON ht.id = chr.hardware_type_id  
JOIN cabinet_types ct ON ct.id = chr.cabinet_type_id
WHERE ct.name = '4 door base';
-- Add door style configurations for 1 Door Base Cabinet
INSERT INTO cabinet_type_finishes (cabinet_type_id, door_style_id, sort_order, active, depth_mm)
SELECT '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c', 'fea550a1-6e56-4592-9f81-c89e8fae84a8', 0, true, 560
WHERE NOT EXISTS (
  SELECT 1 FROM cabinet_type_finishes 
  WHERE cabinet_type_id = '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c' 
  AND door_style_id = 'fea550a1-6e56-4592-9f81-c89e8fae84a8'
);

INSERT INTO cabinet_type_finishes (cabinet_type_id, door_style_id, sort_order, active, depth_mm)
SELECT '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c', '7d82c822-c8c4-4ad8-8dcf-08390f5f01b9', 1, true, 560
WHERE NOT EXISTS (
  SELECT 1 FROM cabinet_type_finishes 
  WHERE cabinet_type_id = '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c' 
  AND door_style_id = '7d82c822-c8c4-4ad8-8dcf-08390f5f01b9'
);

INSERT INTO cabinet_type_finishes (cabinet_type_id, door_style_id, sort_order, active, depth_mm)
SELECT '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c', 'c77279d0-8951-465b-805c-3f2e5c0d041e', 2, true, 560
WHERE NOT EXISTS (
  SELECT 1 FROM cabinet_type_finishes 
  WHERE cabinet_type_id = '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c' 
  AND door_style_id = 'c77279d0-8951-465b-805c-3f2e5c0d041e'
);

INSERT INTO cabinet_type_finishes (cabinet_type_id, door_style_id, sort_order, active, depth_mm)
SELECT '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c', '7158cb7e-f30f-4875-8a59-e39cf0dd3b47', 3, true, 560
WHERE NOT EXISTS (
  SELECT 1 FROM cabinet_type_finishes 
  WHERE cabinet_type_id = '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c' 
  AND door_style_id = '7158cb7e-f30f-4875-8a59-e39cf0dd3b47'
);

INSERT INTO cabinet_type_finishes (cabinet_type_id, door_style_id, sort_order, active, depth_mm)
SELECT '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c', 'a84d294a-e113-4ca7-9f3e-1d4bd6561411', 4, true, 560
WHERE NOT EXISTS (
  SELECT 1 FROM cabinet_type_finishes 
  WHERE cabinet_type_id = '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c' 
  AND door_style_id = 'a84d294a-e113-4ca7-9f3e-1d4bd6561411'
);
-- Add door style configurations for 1 Door Base Cabinet
INSERT INTO cabinet_type_finishes (cabinet_type_id, door_style_id, sort_order, active, depth_mm)
VALUES 
  ('5ec0aa14-2ad5-44ce-9df0-27d14beaec4c', 'fea550a1-6e56-4592-9f81-c89e8fae84a8', 0, true, 560), -- Laminex
  ('5ec0aa14-2ad5-44ce-9df0-27d14beaec4c', '7d82c822-c8c4-4ad8-8dcf-08390f5f01b9', 1, true, 560), -- Poly  
  ('5ec0aa14-2ad5-44ce-9df0-27d14beaec4c', 'c77279d0-8951-465b-805c-3f2e5c0d041e', 2, true, 560), -- Polytec
  ('5ec0aa14-2ad5-44ce-9df0-27d14beaec4c', '7158cb7e-f30f-4875-8a59-e39cf0dd3b47', 3, true, 560), -- Shadowline  
  ('5ec0aa14-2ad5-44ce-9df0-27d14beaec4c', 'a84d294a-e113-4ca7-9f3e-1d4bd6561411', 4, true, 560)  -- Shaker
ON CONFLICT (cabinet_type_id, door_style_id) DO NOTHING;

-- Add door style configurations for 2 Door Base Cabinet
INSERT INTO cabinet_type_finishes (cabinet_type_id, door_style_id, sort_order, active, depth_mm)
VALUES 
  ('9d7b99c3-5d93-4130-bfee-f2674e51fcc7', 'fea550a1-6e56-4592-9f81-c89e8fae84a8', 0, true, 560), -- Laminex
  ('9d7b99c3-5d93-4130-bfee-f2674e51fcc7', '7d82c822-c8c4-4ad8-8dcf-08390f5f01b9', 1, true, 560), -- Poly  
  ('9d7b99c3-5d93-4130-bfee-f2674e51fcc7', 'c77279d0-8951-465b-805c-3f2e5c0d041e', 2, true, 560), -- Polytec
  ('9d7b99c3-5d93-4130-bfee-f2674e51fcc7', '7158cb7e-f30f-4875-8a59-e39cf0dd3b47', 3, true, 560), -- Shadowline  
  ('9d7b99c3-5d93-4130-bfee-f2674e51fcc7', 'a84d294a-e113-4ca7-9f3e-1d4bd6561411', 4, true, 560)  -- Shaker
ON CONFLICT (cabinet_type_id, door_style_id) DO NOTHING;

-- Add door style configurations for Pot Drawer Base
INSERT INTO cabinet_type_finishes (cabinet_type_id, door_style_id, sort_order, active, depth_mm)
VALUES 
  ('3d50dff2-6be5-4317-a954-2b7d27cfb5d7', 'fea550a1-6e56-4592-9f81-c89e8fae84a8', 0, true, 560), -- Laminex
  ('3d50dff2-6be5-4317-a954-2b7d27cfb5d7', '7d82c822-c8c4-4ad8-8dcf-08390f5f01b9', 1, true, 560), -- Poly  
  ('3d50dff2-6be5-4317-a954-2b7d27cfb5d7', 'c77279d0-8951-465b-805c-3f2e5c0d041e', 2, true, 560), -- Polytec
  ('3d50dff2-6be5-4317-a954-2b7d27cfb5d7', '7158cb7e-f30f-4875-8a59-e39cf0dd3b47', 3, true, 560), -- Shadowline  
  ('3d50dff2-6be5-4317-a954-2b7d27cfb5d7', 'a84d294a-e113-4ca7-9f3e-1d4bd6561411', 4, true, 560)  -- Shaker
ON CONFLICT (cabinet_type_id, door_style_id) DO NOTHING;
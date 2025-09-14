-- Create cabinet parts for 4 door base cabinet
INSERT INTO cabinet_parts (cabinet_type_id, part_name, width_formula, height_formula, quantity, is_door, is_hardware)
VALUES 
  ('bf62ff11-2026-4039-9879-f78cf5a7eb8c', 'Back', 'width', 'height', 1, false, false),
  ('bf62ff11-2026-4039-9879-f78cf5a7eb8c', 'Bottom', 'width', 'depth', 1, false, false),
  ('bf62ff11-2026-4039-9879-f78cf5a7eb8c', 'Side', 'depth', 'height', 2, false, false),
  ('bf62ff11-2026-4039-9879-f78cf5a7eb8c', 'Door', 'width', 'height', 4, true, false),
  ('bf62ff11-2026-4039-9879-f78cf5a7eb8c', 'Center Divider', 'depth', 'height', 1, false, false);
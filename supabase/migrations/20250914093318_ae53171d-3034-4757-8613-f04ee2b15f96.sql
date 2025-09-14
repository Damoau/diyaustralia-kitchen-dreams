-- Fix the unit_scope constraint to allow 'custom' option
ALTER TABLE cabinet_hardware_requirements 
DROP CONSTRAINT IF EXISTS cabinet_hardware_requirements_unit_scope_check;

-- Add updated constraint that includes 'custom'
ALTER TABLE cabinet_hardware_requirements 
ADD CONSTRAINT cabinet_hardware_requirements_unit_scope_check 
CHECK (unit_scope IN ('per_cabinet', 'per_door', 'per_drawer', 'custom'));
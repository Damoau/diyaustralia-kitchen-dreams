-- Add weight_per_sqm field to material_specifications table for HMR volume calculations
ALTER TABLE public.material_specifications 
ADD COLUMN weight_per_sqm NUMERIC(10,3) DEFAULT 12.0;

-- Update existing HMR materials with weight per sqm values
UPDATE public.material_specifications 
SET weight_per_sqm = CASE 
  WHEN material_type = 'HMR' THEN 12.0
  WHEN material_type = 'MDF' THEN 11.5
  WHEN material_type = 'Plywood' THEN 10.8
  WHEN material_type = 'Particle Board' THEN 12.2
  WHEN material_type = 'Melamine' THEN 11.8
  WHEN material_type = 'Solid Timber' THEN 8.5
  ELSE 12.0
END;

-- Add comment explaining the field
COMMENT ON COLUMN public.material_specifications.weight_per_sqm IS 'Weight per square meter in kg/sqm used for volume calculations in checkout';
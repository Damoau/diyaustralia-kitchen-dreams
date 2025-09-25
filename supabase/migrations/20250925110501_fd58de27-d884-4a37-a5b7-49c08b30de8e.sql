-- Add material weight properties to door_styles
ALTER TABLE door_styles 
ADD COLUMN IF NOT EXISTS material_density_kg_per_sqm NUMERIC(10,3) DEFAULT 12.0,
ADD COLUMN IF NOT EXISTS thickness_mm INTEGER DEFAULT 18,
ADD COLUMN IF NOT EXISTS weight_factor NUMERIC(3,2) DEFAULT 1.0;

-- Add material weight properties to cabinet_parts  
ALTER TABLE cabinet_parts
ADD COLUMN IF NOT EXISTS material_thickness_mm INTEGER DEFAULT 18,
ADD COLUMN IF NOT EXISTS material_density_kg_per_sqm NUMERIC(10,3) DEFAULT 12.0,
ADD COLUMN IF NOT EXISTS weight_multiplier NUMERIC(3,2) DEFAULT 1.0;

-- Add assembly service pricing to postcode_zones
ALTER TABLE postcode_zones
ADD COLUMN IF NOT EXISTS assembly_price_per_cabinet NUMERIC(8,2) DEFAULT 150.00,
ADD COLUMN IF NOT EXISTS depot_delivery_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS home_delivery_available BOOLEAN DEFAULT true;

-- Create material_specifications table for detailed weight calculations
CREATE TABLE IF NOT EXISTS material_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_type TEXT NOT NULL,
  density_kg_per_cubic_m NUMERIC(10,3) NOT NULL DEFAULT 600.0,
  standard_thickness_mm INTEGER NOT NULL DEFAULT 18,
  weight_factor NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  cost_per_sqm NUMERIC(8,2) NOT NULL DEFAULT 50.0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default material specifications
INSERT INTO material_specifications (material_type, density_kg_per_cubic_m, standard_thickness_mm, weight_factor, cost_per_sqm) VALUES
('MDF', 750.0, 18, 1.0, 45.0),
('Plywood', 650.0, 18, 0.9, 55.0),
('Particle Board', 680.0, 18, 0.95, 35.0),
('Solid Timber', 550.0, 20, 0.8, 120.0),
('Melamine', 720.0, 16, 1.1, 40.0);

-- Enable RLS
ALTER TABLE material_specifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for material_specifications
CREATE POLICY "Anyone can view material specifications"
ON material_specifications FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage material specifications"
ON material_specifications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update existing door_styles with realistic material density values
UPDATE door_styles SET 
  material_density_kg_per_sqm = CASE 
    WHEN name ILIKE '%mdf%' THEN 13.5
    WHEN name ILIKE '%timber%' OR name ILIKE '%wood%' THEN 9.9
    WHEN name ILIKE '%melamine%' THEN 12.96
    WHEN name ILIKE '%poly%' THEN 12.24
    ELSE 12.0
  END,
  thickness_mm = CASE
    WHEN name ILIKE '%shaker%' THEN 20
    WHEN name ILIKE '%raised%' THEN 22  
    ELSE 18
  END;
-- Add assembly pricing columns to cabinet_types table
ALTER TABLE public.cabinet_types 
ADD COLUMN assembly_carcass_only_price NUMERIC DEFAULT 0,
ADD COLUMN assembly_with_doors_price NUMERIC DEFAULT 0,
ADD COLUMN assembly_available BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.cabinet_types.assembly_carcass_only_price IS 'Price for carcass only assembly (with drawer runners if applicable)';
COMMENT ON COLUMN public.cabinet_types.assembly_with_doors_price IS 'Price for complete assembly including doors fitted';
COMMENT ON COLUMN public.cabinet_types.assembly_available IS 'Whether assembly is available for this cabinet type';
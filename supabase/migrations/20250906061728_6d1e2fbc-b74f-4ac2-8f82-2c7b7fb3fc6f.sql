
-- 1) Add door_count and drawer_count to cabinet_types
ALTER TABLE public.cabinet_types
ADD COLUMN IF NOT EXISTS door_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS drawer_count integer NOT NULL DEFAULT 0;

-- 2) Define table for hardware requirements per cabinet type
CREATE TABLE IF NOT EXISTS public.cabinet_hardware_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_type_id uuid NOT NULL REFERENCES public.cabinet_types(id) ON DELETE CASCADE,
  hardware_type_id uuid NOT NULL REFERENCES public.hardware_types(id) ON DELETE RESTRICT,
  -- How quantity is calculated
  unit_scope text NOT NULL CHECK (unit_scope IN ('per_cabinet', 'per_door', 'per_drawer')),
  units_per_scope integer NOT NULL DEFAULT 1, -- e.g., 2 hinges per door, 1 runner per drawer
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Map a requirement to specific products per brand (Titus vs Blum, etc.)
CREATE TABLE IF NOT EXISTS public.cabinet_hardware_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid NOT NULL REFERENCES public.cabinet_hardware_requirements(id) ON DELETE CASCADE,
  hardware_brand_id uuid NOT NULL REFERENCES public.hardware_brands(id) ON DELETE RESTRICT,
  hardware_product_id uuid NOT NULL REFERENCES public.hardware_products(id) ON DELETE RESTRICT,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_requirement_brand UNIQUE (requirement_id, hardware_brand_id)
);

-- 4) RLS
ALTER TABLE public.cabinet_hardware_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabinet_hardware_options ENABLE ROW LEVEL SECURITY;

-- Admin policies (manage)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'cabinet_hardware_requirements' AND policyname = 'Admins can manage cabinet hardware requirements'
  ) THEN
    CREATE POLICY "Admins can manage cabinet hardware requirements"
      ON public.cabinet_hardware_requirements
      FOR ALL
      USING (has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'cabinet_hardware_options' AND policyname = 'Admins can manage cabinet hardware options'
  ) THEN
    CREATE POLICY "Admins can manage cabinet hardware options"
      ON public.cabinet_hardware_options
      FOR ALL
      USING (has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Public read policies (only active rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'cabinet_hardware_requirements' AND policyname = 'Anyone can view active cabinet hardware requirements'
  ) THEN
    CREATE POLICY "Anyone can view active cabinet hardware requirements"
      ON public.cabinet_hardware_requirements
      FOR SELECT
      USING (active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'cabinet_hardware_options' AND policyname = 'Anyone can view active cabinet hardware options'
  ) THEN
    CREATE POLICY "Anyone can view active cabinet hardware options"
      ON public.cabinet_hardware_options
      FOR SELECT
      USING (active = true);
  END IF;
END $$;

-- 5) Optional: seed Titus and Blum if not present
INSERT INTO public.hardware_brands (name, active)
SELECT 'Titus', true
WHERE NOT EXISTS (SELECT 1 FROM public.hardware_brands WHERE lower(name) = 'titus');

INSERT INTO public.hardware_brands (name, active)
SELECT 'Blum', true
WHERE NOT EXISTS (SELECT 1 FROM public.hardware_brands WHERE lower(name) = 'blum');

-- Optional: seed types "hinge" and "runner" if none exist with those names
INSERT INTO public.hardware_types (name, category, active)
SELECT 'Hinge', 'hinge', true
WHERE NOT EXISTS (SELECT 1 FROM public.hardware_types WHERE lower(name) = 'hinge');

INSERT INTO public.hardware_types (name, category, active)
SELECT 'Runner', 'runner', true
WHERE NOT EXISTS (SELECT 1 FROM public.hardware_types WHERE lower(name) = 'runner');

-- Optional: add example products for Blum Antaro and Titus hinges/runners (only if missing)
WITH brand_ids AS (
  SELECT 
    (SELECT id FROM public.hardware_brands WHERE lower(name) = 'blum') AS blum_id,
    (SELECT id FROM public.hardware_brands WHERE lower(name) = 'titus') AS titus_id
),
type_ids AS (
  SELECT 
    (SELECT id FROM public.hardware_types WHERE lower(name) = 'hinge') AS hinge_type_id,
    (SELECT id FROM public.hardware_types WHERE lower(name) = 'runner') AS runner_type_id
)
INSERT INTO public.hardware_products (name, model_number, hardware_type_id, hardware_brand_id, cost_per_unit, active)
SELECT 'Blum Antaro Runner (500mm)', 'ANTARO-500', t.runner_type_id, b.blum_id, 25.00, true
FROM brand_ids b, type_ids t
WHERE b.blum_id IS NOT NULL
  AND t.runner_type_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.hardware_products 
    WHERE lower(name) = lower('Blum Antaro Runner (500mm)')
      AND hardware_brand_id = b.blum_id
  );

WITH brand_ids AS (
  SELECT 
    (SELECT id FROM public.hardware_brands WHERE lower(name) = 'titus') AS titus_id,
    (SELECT id FROM public.hardware_brands WHERE lower(name) = 'blum') AS blum_id
),
type_ids AS (
  SELECT 
    (SELECT id FROM public.hardware_types WHERE lower(name) = 'hinge') AS hinge_type_id,
    (SELECT id FROM public.hardware_types WHERE lower(name) = 'runner') AS runner_type_id
)
INSERT INTO public.hardware_products (name, model_number, hardware_type_id, hardware_brand_id, cost_per_unit, active)
SELECT 'Titus 110° Hinge', 'TITUS-110', t.hinge_type_id, b.titus_id, 3.20, true
FROM brand_ids b, type_ids t
WHERE b.titus_id IS NOT NULL
  AND t.hinge_type_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.hardware_products 
    WHERE lower(name) = lower('Titus 110° Hinge')
      AND hardware_brand_id = b.titus_id
  );

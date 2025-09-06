
-- 1) Add pricing formula and default hardware brand to cabinet_types
ALTER TABLE public.cabinet_types
  ADD COLUMN IF NOT EXISTS pricing_formula jsonb NULL,
  ADD COLUMN IF NOT EXISTS default_hardware_brand_id uuid NULL REFERENCES public.hardware_brands(id);

-- 2) Table: cabinet_type_price_ranges (rows in the left column of the price table)
CREATE TABLE IF NOT EXISTS public.cabinet_type_price_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_type_id uuid NOT NULL REFERENCES public.cabinet_types(id) ON DELETE CASCADE,
  label text NOT NULL,                               -- e.g., "400-449mm", "600mm"
  min_width_mm integer NOT NULL,
  max_width_mm integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cabinet_type_price_ranges ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY IF NOT EXISTS "Admins can manage cabinet type price ranges"
  ON public.cabinet_type_price_ranges
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active ranges
CREATE POLICY IF NOT EXISTS "Anyone can view active cabinet type price ranges"
  ON public.cabinet_type_price_ranges
  FOR SELECT
  USING (active = true);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_cab_type_ranges_cabinet_type ON public.cabinet_type_price_ranges (cabinet_type_id, active, sort_order);

-- 3) Table: cabinet_type_finishes (which finishes to display as columns)
CREATE TABLE IF NOT EXISTS public.cabinet_type_finishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_type_id uuid NOT NULL REFERENCES public.cabinet_types(id) ON DELETE CASCADE,
  finish_id uuid NOT NULL REFERENCES public.finishes(id),
  door_style_id uuid NULL REFERENCES public.door_styles(id), -- optional pairing for pricing
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_cabinet_type_finish UNIQUE (cabinet_type_id, finish_id)
);

ALTER TABLE public.cabinet_type_finishes ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY IF NOT EXISTS "Admins can manage cabinet type finishes"
  ON public.cabinet_type_finishes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active mappings
CREATE POLICY IF NOT EXISTS "Anyone can view active cabinet type finishes"
  ON public.cabinet_type_finishes
  FOR SELECT
  USING (active = true);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_cab_type_finishes_cabinet_type ON public.cabinet_type_finishes (cabinet_type_id, active, sort_order);

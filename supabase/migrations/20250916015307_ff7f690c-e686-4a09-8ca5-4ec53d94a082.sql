-- Add missing roles to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'logistics';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'assembly';

-- Create shipment_packages table (if not exists)
CREATE TABLE IF NOT EXISTS public.shipment_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('carton', 'pallet', 'bundle', 'crate')) DEFAULT 'carton',
  length_mm INTEGER NOT NULL,
  width_mm INTEGER NOT NULL,
  height_mm INTEGER NOT NULL,
  weight_kg NUMERIC(10,3) NOT NULL,
  cubic_m NUMERIC(10,6) GENERATED ALWAYS AS ((length_mm * width_mm * height_mm) / 1000000000.0) STORED,
  volumetric_weight_kg NUMERIC(10,3) GENERATED ALWAYS AS (GREATEST(weight_kg, (length_mm * width_mm * height_mm) / 5000000.0)) STORED,
  reference TEXT,
  fragile BOOLEAN DEFAULT FALSE,
  stackable BOOLEAN DEFAULT TRUE,
  contents JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rate_cards table
CREATE TABLE IF NOT EXISTS public.rate_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier TEXT NOT NULL,
  service_name TEXT NOT NULL,
  zone_from TEXT NOT NULL,
  zone_to TEXT NOT NULL,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_kg NUMERIC(10,4) NOT NULL DEFAULT 0,
  per_cubic_m NUMERIC(10,2) NOT NULL DEFAULT 0,
  fuel_levy_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  residential_surcharge NUMERIC(10,2) NOT NULL DEFAULT 25.00,
  tail_lift_fee NUMERIC(10,2) NOT NULL DEFAULT 45.00,
  two_man_fee NUMERIC(10,2) NOT NULL DEFAULT 90.00,
  reattempt_fee NUMERIC(10,2) NOT NULL DEFAULT 35.00,
  minimum_charge NUMERIC(10,2) NOT NULL DEFAULT 15.00,
  max_weight_kg INTEGER DEFAULT 1000,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create postcode_zones table
CREATE TABLE IF NOT EXISTS public.postcode_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL,
  postcode TEXT NOT NULL,
  zone TEXT NOT NULL,
  assembly_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  lead_time_days INTEGER NOT NULL DEFAULT 5,
  metro BOOLEAN NOT NULL DEFAULT FALSE,
  remote BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(state, postcode)
);

-- Create assembly_jobs table
CREATE TABLE IF NOT EXISTS public.assembly_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shipment_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  components_included TEXT NOT NULL CHECK (components_included IN ('carcasses', 'doors', 'both')) DEFAULT 'both',
  hours_estimated NUMERIC(5,2) NOT NULL DEFAULT 0,
  hours_actual NUMERIC(5,2),
  price_ex_gst NUMERIC(10,2) NOT NULL DEFAULT 0,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_team TEXT,
  customer_notes TEXT,
  technician_notes TEXT,
  site_photos JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create depot_list table
CREATE TABLE IF NOT EXISTS public.depot_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier TEXT NOT NULL,
  name TEXT NOT NULL,
  address_id UUID NOT NULL REFERENCES public.addresses(id),
  opening_hours JSONB,
  contact_phone TEXT,
  contact_email TEXT,
  facilities JSONB,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exceptions table
CREATE TABLE IF NOT EXISTS public.exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('damage', 'address_issue', 'missed_delivery', 'weight_mismatch', 'access_denied', 'weather_delay')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  resolution_status TEXT NOT NULL CHECK (resolution_status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  cost_impact NUMERIC(10,2) DEFAULT 0,
  description TEXT NOT NULL,
  resolution_notes TEXT,
  photos JSONB,
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create printing_queue table
CREATE TABLE IF NOT EXISTS public.printing_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('label', 'pack_slip', 'run_sheet', 'job_sheet')),
  payload JSONB NOT NULL,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'printed', 'failed')),
  printer_name TEXT,
  printed_by UUID REFERENCES auth.users(id),
  printed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE public.shipment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_cards ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.postcode_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depot_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printing_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies using existing roles
CREATE POLICY "Fulfilment team can manage packages"
  ON public.shipment_packages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'fulfilment'::app_role));

CREATE POLICY "Admins can manage rate cards"
  ON public.rate_cards FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active rate cards"
  ON public.rate_cards FOR SELECT
  USING (active = true AND (effective_to IS NULL OR effective_to >= CURRENT_DATE));

CREATE POLICY "Admins can manage postcode zones"
  ON public.postcode_zones FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view postcode zones"
  ON public.postcode_zones FOR SELECT
  USING (true);

CREATE POLICY "Fulfilment team can manage assembly jobs"
  ON public.assembly_jobs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'fulfilment'::app_role));

CREATE POLICY "Admins can manage depot list"
  ON public.depot_list FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active depots"
  ON public.depot_list FOR SELECT
  USING (active = true);

CREATE POLICY "Fulfilment team can manage exceptions"
  ON public.exceptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'fulfilment'::app_role));

CREATE POLICY "Fulfilment team can manage printing queue"
  ON public.printing_queue FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'fulfilment'::app_role));

-- Insert default data
INSERT INTO public.postcode_zones (state, postcode, zone, assembly_eligible, delivery_eligible, lead_time_days, metro, remote) 
VALUES
('NSW', '2000', 'SYD-METRO', true, true, 3, true, false),
('VIC', '3000', 'MEL-METRO', true, true, 3, true, false),
('QLD', '4000', 'BNE-METRO', true, true, 4, true, false),
('WA', '6000', 'PER-METRO', false, true, 7, true, false),
('SA', '5000', 'ADL-METRO', false, true, 5, true, false)
ON CONFLICT (state, postcode) DO NOTHING;

INSERT INTO public.rate_cards (carrier, service_name, zone_from, zone_to, base_price, per_kg, per_cubic_m, fuel_levy_pct) 
VALUES
('TNT', 'Road Express', 'SYD-METRO', 'MEL-METRO', 45.00, 1.20, 250.00, 12.5),
('Allied', 'General Freight', 'MEL-METRO', 'SYD-METRO', 48.00, 1.15, 240.00, 11.0),
('StarTrack', 'Road', 'SYD-METRO', 'PER-METRO', 85.00, 2.20, 450.00, 15.0);

-- Create shipping calculation function
CREATE OR REPLACE FUNCTION public.calculate_shipping_quote(
  p_packages JSONB,
  p_from_zone TEXT,
  p_to_zone TEXT,
  p_residential BOOLEAN DEFAULT FALSE,
  p_tail_lift BOOLEAN DEFAULT FALSE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rate_card RECORD;
  v_total_weight NUMERIC := 0;
  v_total_cubic NUMERIC := 0;
  v_total_ex_gst NUMERIC := 0;
  v_package JSONB;
BEGIN
  FOR v_package IN SELECT * FROM jsonb_array_elements(p_packages)
  LOOP
    v_total_weight := v_total_weight + (v_package->>'weight_kg')::NUMERIC;
    v_total_cubic := v_total_cubic + (v_package->>'cubic_m')::NUMERIC;
  END LOOP;

  SELECT * INTO v_rate_card
  FROM public.rate_cards
  WHERE zone_from = p_from_zone 
    AND zone_to = p_to_zone
    AND active = true
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'No rate card found');
  END IF;

  v_total_ex_gst := v_rate_card.base_price + 
                    (v_rate_card.per_kg * v_total_weight) + 
                    (v_rate_card.per_cubic_m * v_total_cubic);

  IF p_residential THEN
    v_total_ex_gst := v_total_ex_gst + v_rate_card.residential_surcharge;
  END IF;

  IF p_tail_lift THEN
    v_total_ex_gst := v_total_ex_gst + v_rate_card.tail_lift_fee;
  END IF;

  v_total_ex_gst := GREATEST(v_total_ex_gst, v_rate_card.minimum_charge);

  RETURN jsonb_build_object(
    'carrier', v_rate_card.carrier,
    'service_name', v_rate_card.service_name,
    'total_weight_kg', v_total_weight,
    'total_cubic_m', v_total_cubic,
    'total_ex_gst', ROUND(v_total_ex_gst, 2),
    'gst', ROUND(v_total_ex_gst * 0.10, 2),
    'total_inc_gst', ROUND(v_total_ex_gst * 1.10, 2)
  );
END;
$$;
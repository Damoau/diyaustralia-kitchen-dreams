-- Create shipments table
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('pickup', 'depot', 'door', 'assembly')),
  carrier TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'booked', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'cancelled')),
  tracking_number TEXT,
  tracking_url TEXT,
  label_url TEXT,
  service_cost NUMERIC(10,2) DEFAULT 0,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  incoterms TEXT DEFAULT 'DDP',
  notes TEXT,
  pickup_address_id UUID REFERENCES public.addresses(id),
  delivery_address_id UUID REFERENCES public.addresses(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  booked_at TIMESTAMP WITH TIME ZONE,
  dispatched_at TIMESTAMP WITH TIME ZONE
);

-- Create shipment_packages table
CREATE TABLE public.shipment_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
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

-- Create shipment_labels table  
CREATE TABLE public.shipment_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  provider_label_url TEXT,
  zpl_data TEXT,
  pdf_url TEXT,
  label_type TEXT DEFAULT 'shipping',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create rate_cards table
CREATE TABLE public.rate_cards (
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
  max_length_mm INTEGER DEFAULT 2440,
  max_width_mm INTEGER DEFAULT 1200,
  max_height_mm INTEGER DEFAULT 1000,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create postcode_zones table
CREATE TABLE public.postcode_zones (
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
CREATE TABLE public.assembly_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id),
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
CREATE TABLE public.depot_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier TEXT NOT NULL,
  name TEXT NOT NULL,
  address_id UUID NOT NULL REFERENCES public.addresses(id),
  opening_hours JSONB,
  contact_phone TEXT,
  contact_email TEXT,
  facilities JSONB, -- forklift, dock, parking etc
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exceptions table
CREATE TABLE public.exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
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
CREATE TABLE public.printing_queue (
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

-- Create indexes for performance
CREATE INDEX idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_carrier ON public.shipments(carrier);
CREATE INDEX idx_shipment_packages_shipment_id ON public.shipment_packages(shipment_id);
CREATE INDEX idx_rate_cards_carrier_zones ON public.rate_cards(carrier, zone_from, zone_to);
CREATE INDEX idx_rate_cards_effective_dates ON public.rate_cards(effective_from, effective_to);
CREATE INDEX idx_postcode_zones_postcode ON public.postcode_zones(postcode);
CREATE INDEX idx_postcode_zones_state_postcode ON public.postcode_zones(state, postcode);
CREATE INDEX idx_assembly_jobs_order_id ON public.assembly_jobs(order_id);
CREATE INDEX idx_assembly_jobs_scheduled_for ON public.assembly_jobs(scheduled_for);
CREATE INDEX idx_exceptions_shipment_id ON public.exceptions(shipment_id);
CREATE INDEX idx_exceptions_status ON public.exceptions(resolution_status);
CREATE INDEX idx_printing_queue_status ON public.printing_queue(status);

-- Add update triggers
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rate_cards_updated_at
  BEFORE UPDATE ON public.rate_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_postcode_zones_updated_at
  BEFORE UPDATE ON public.postcode_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assembly_jobs_updated_at
  BEFORE UPDATE ON public.assembly_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exceptions_updated_at
  BEFORE UPDATE ON public.exceptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_printing_queue_updated_at
  BEFORE UPDATE ON public.printing_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postcode_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depot_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printing_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shipments
CREATE POLICY "Admins and logistics can manage all shipments"
  ON public.shipments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'fulfilment'::app_role) OR has_role(auth.uid(), 'logistics'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'fulfilment'::app_role) OR has_role(auth.uid(), 'logistics'::app_role));

CREATE POLICY "Users can view their own order shipments"
  ON public.shipments FOR SELECT
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- RLS Policies for shipment_packages
CREATE POLICY "Admins and logistics can manage all packages"
  ON public.shipment_packages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'fulfilment'::app_role) OR has_role(auth.uid(), 'logistics'::app_role));

CREATE POLICY "Users can view their own shipment packages"
  ON public.shipment_packages FOR SELECT
  USING (shipment_id IN (
    SELECT s.id FROM public.shipments s 
    JOIN public.orders o ON s.order_id = o.id 
    WHERE o.user_id = auth.uid()
  ));

-- RLS Policies for shipment_labels
CREATE POLICY "Admins and logistics can manage all labels"
  ON public.shipment_labels FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'fulfilment'::app_role) OR has_role(auth.uid(), 'logistics'::app_role));

-- RLS Policies for rate_cards
CREATE POLICY "Admins can manage rate cards"
  ON public.rate_cards FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'logistics'::app_role));

CREATE POLICY "Anyone can view active rate cards"
  ON public.rate_cards FOR SELECT
  USING (active = true AND (effective_to IS NULL OR effective_to >= CURRENT_DATE));

-- RLS Policies for postcode_zones
CREATE POLICY "Admins can manage postcode zones"
  ON public.postcode_zones FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'logistics'::app_role));

CREATE POLICY "Anyone can view postcode zones"
  ON public.postcode_zones FOR SELECT
  USING (true);

-- RLS Policies for assembly_jobs
CREATE POLICY "Admins and assembly team can manage assembly jobs"
  ON public.assembly_jobs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'assembly'::app_role) OR has_role(auth.uid(), 'fulfilment'::app_role));

CREATE POLICY "Users can view their own assembly jobs"
  ON public.assembly_jobs FOR SELECT
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- RLS Policies for depot_list
CREATE POLICY "Admins can manage depot list"
  ON public.depot_list FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'logistics'::app_role));

CREATE POLICY "Anyone can view active depots"
  ON public.depot_list FOR SELECT
  USING (active = true);

-- RLS Policies for exceptions
CREATE POLICY "Admins and logistics can manage all exceptions"
  ON public.exceptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'fulfilment'::app_role) OR has_role(auth.uid(), 'logistics'::app_role));

CREATE POLICY "Users can view exceptions for their shipments"
  ON public.exceptions FOR SELECT
  USING (shipment_id IN (
    SELECT s.id FROM public.shipments s 
    JOIN public.orders o ON s.order_id = o.id 
    WHERE o.user_id = auth.uid()
  ));

-- RLS Policies for printing_queue
CREATE POLICY "Admins and logistics can manage printing queue"
  ON public.printing_queue FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'fulfilment'::app_role) OR has_role(auth.uid(), 'logistics'::app_role));

-- Insert default postcode zones for major Australian cities
INSERT INTO public.postcode_zones (state, postcode, zone, assembly_eligible, delivery_eligible, lead_time_days, metro, remote) VALUES
-- Sydney Metro
('NSW', '2000', 'SYD-METRO', true, true, 3, true, false),
('NSW', '2001', 'SYD-METRO', true, true, 3, true, false),
('NSW', '2010', 'SYD-METRO', true, true, 3, true, false),
('NSW', '2020', 'SYD-METRO', true, true, 3, true, false),
-- Melbourne Metro  
('VIC', '3000', 'MEL-METRO', true, true, 3, true, false),
('VIC', '3001', 'MEL-METRO', true, true, 3, true, false),
('VIC', '3010', 'MEL-METRO', true, true, 3, true, false),
('VIC', '3020', 'MEL-METRO', true, true, 3, true, false),
-- Brisbane Metro
('QLD', '4000', 'BNE-METRO', true, true, 4, true, false),
('QLD', '4001', 'BNE-METRO', true, true, 4, true, false),
('QLD', '4010', 'BNE-METRO', true, true, 4, true, false),
-- Perth Metro
('WA', '6000', 'PER-METRO', false, true, 7, true, false),
('WA', '6001', 'PER-METRO', false, true, 7, true, false),
-- Adelaide Metro
('SA', '5000', 'ADL-METRO', false, true, 5, true, false),
('SA', '5001', 'ADL-METRO', false, true, 5, true, false);

-- Insert default rate cards
INSERT INTO public.rate_cards (carrier, service_name, zone_from, zone_to, base_price, per_kg, per_cubic_m, fuel_levy_pct) VALUES
('TNT', 'Road Express', 'SYD-METRO', 'MEL-METRO', 45.00, 1.20, 250.00, 12.5),
('TNT', 'Road Express', 'SYD-METRO', 'BNE-METRO', 55.00, 1.40, 280.00, 12.5),
('Allied', 'General Freight', 'MEL-METRO', 'SYD-METRO', 48.00, 1.15, 240.00, 11.0),
('Allied', 'General Freight', 'MEL-METRO', 'ADL-METRO', 38.00, 0.95, 200.00, 11.0),
('StarTrack', 'Road', 'SYD-METRO', 'PER-METRO', 85.00, 2.20, 450.00, 15.0);

-- Create business logic functions
CREATE OR REPLACE FUNCTION public.calculate_shipping_quote(
  p_packages JSONB,
  p_from_zone TEXT,
  p_to_zone TEXT,
  p_residential BOOLEAN DEFAULT FALSE,
  p_tail_lift BOOLEAN DEFAULT FALSE,
  p_two_man BOOLEAN DEFAULT FALSE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rate_card RECORD;
  v_total_weight NUMERIC := 0;
  v_total_cubic NUMERIC := 0;
  v_base_cost NUMERIC := 0;
  v_weight_cost NUMERIC := 0;
  v_cubic_cost NUMERIC := 0;
  v_fuel_levy NUMERIC := 0;
  v_surcharges NUMERIC := 0;
  v_total_ex_gst NUMERIC := 0;
  v_gst NUMERIC := 0;
  v_total_inc_gst NUMERIC := 0;
  v_package JSONB;
BEGIN
  -- Calculate totals from packages
  FOR v_package IN SELECT * FROM jsonb_array_elements(p_packages)
  LOOP
    v_total_weight := v_total_weight + (v_package->>'weight_kg')::NUMERIC;
    v_total_cubic := v_total_cubic + (v_package->>'cubic_m')::NUMERIC;
  END LOOP;

  -- Get best rate card
  SELECT * INTO v_rate_card
  FROM public.rate_cards
  WHERE zone_from = p_from_zone 
    AND zone_to = p_to_zone
    AND active = true
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  ORDER BY (base_price + (per_kg * v_total_weight) + (per_cubic_m * v_total_cubic))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'No rate card found for route');
  END IF;

  -- Calculate costs
  v_base_cost := v_rate_card.base_price;
  v_weight_cost := v_rate_card.per_kg * v_total_weight;
  v_cubic_cost := v_rate_card.per_cubic_m * v_total_cubic;
  v_fuel_levy := (v_base_cost + v_weight_cost + v_cubic_cost) * (v_rate_card.fuel_levy_pct / 100);

  -- Add surcharges
  IF p_residential THEN
    v_surcharges := v_surcharges + v_rate_card.residential_surcharge;
  END IF;
  
  IF p_tail_lift THEN
    v_surcharges := v_surcharges + v_rate_card.tail_lift_fee;
  END IF;
  
  IF p_two_man THEN
    v_surcharges := v_surcharges + v_rate_card.two_man_fee;
  END IF;

  v_total_ex_gst := GREATEST(v_base_cost + v_weight_cost + v_cubic_cost + v_fuel_levy + v_surcharges, v_rate_card.minimum_charge);
  v_gst := v_total_ex_gst * 0.10;
  v_total_inc_gst := v_total_ex_gst + v_gst;

  RETURN jsonb_build_object(
    'carrier', v_rate_card.carrier,
    'service_name', v_rate_card.service_name,
    'total_weight_kg', v_total_weight,
    'total_cubic_m', v_total_cubic,
    'base_cost', v_base_cost,
    'weight_cost', v_weight_cost,
    'cubic_cost', v_cubic_cost,
    'fuel_levy', v_fuel_levy,
    'surcharges', v_surcharges,
    'total_ex_gst', ROUND(v_total_ex_gst, 2),
    'gst', ROUND(v_gst, 2),
    'total_inc_gst', ROUND(v_total_inc_gst, 2)
  );
END;
$$;

-- Function to auto-pack order items into packages
CREATE OR REPLACE FUNCTION public.auto_pack_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_packages JSONB := '[]'::JSONB;
  v_item RECORD;
  v_package JSONB;
  v_total_weight NUMERIC := 0;
  v_total_cubic NUMERIC := 0;
BEGIN
  -- Simple auto-pack logic - group by cabinet type category
  FOR v_item IN 
    SELECT 
      oi.*,
      ct.category,
      ct.name as cabinet_name,
      ct.default_width_mm,
      ct.default_height_mm,
      ct.default_depth_mm
    FROM public.order_items oi
    JOIN public.cabinet_types ct ON oi.cabinet_type_id = ct.id
    WHERE oi.order_id = p_order_id
  LOOP
    -- Create package based on cabinet type
    CASE v_item.category
      WHEN 'base-cabinets' THEN
        v_package := jsonb_build_object(
          'kind', 'pallet',
          'length_mm', GREATEST(v_item.width_mm, v_item.default_width_mm),
          'width_mm', GREATEST(v_item.depth_mm, v_item.default_depth_mm),
          'height_mm', GREATEST(v_item.height_mm, v_item.default_height_mm),
          'weight_kg', v_item.quantity * 25, -- Estimated 25kg per base cabinet
          'contents', jsonb_build_array(jsonb_build_object(
            'item_id', v_item.id,
            'cabinet_name', v_item.cabinet_name,
            'quantity', v_item.quantity
          )),
          'fragile', false,
          'stackable', false
        );
      WHEN 'top-cabinets' THEN
        v_package := jsonb_build_object(
          'kind', 'carton',
          'length_mm', GREATEST(v_item.width_mm, v_item.default_width_mm),
          'width_mm', GREATEST(v_item.depth_mm, v_item.default_depth_mm),
          'height_mm', GREATEST(v_item.height_mm, v_item.default_height_mm),
          'weight_kg', v_item.quantity * 15, -- Estimated 15kg per top cabinet
          'contents', jsonb_build_array(jsonb_build_object(
            'item_id', v_item.id,
            'cabinet_name', v_item.cabinet_name,
            'quantity', v_item.quantity
          )),
          'fragile', false,
          'stackable', true
        );
      ELSE
        v_package := jsonb_build_object(
          'kind', 'carton',
          'length_mm', 600,
          'width_mm', 400,
          'height_mm', 300,
          'weight_kg', v_item.quantity * 5,
          'contents', jsonb_build_array(jsonb_build_object(
            'item_id', v_item.id,
            'cabinet_name', v_item.cabinet_name,
            'quantity', v_item.quantity
          )),
          'fragile', false,
          'stackable', true
        );
    END CASE;

    v_total_weight := v_total_weight + (v_package->>'weight_kg')::NUMERIC;
    v_total_cubic := v_total_cubic + (
      (v_package->>'length_mm')::NUMERIC * 
      (v_package->>'width_mm')::NUMERIC * 
      (v_package->>'height_mm')::NUMERIC / 1000000000.0
    );
    
    v_packages := v_packages || jsonb_build_array(v_package);
  END LOOP;

  RETURN jsonb_build_object(
    'packages', v_packages,
    'total_weight_kg', v_total_weight,
    'total_cubic_m', ROUND(v_total_cubic, 6),
    'package_count', jsonb_array_length(v_packages)
  );
END;
$$;
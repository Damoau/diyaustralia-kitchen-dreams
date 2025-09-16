-- Fix RLS policies for shipment_labels table
CREATE POLICY "Users can view their shipment labels"
  ON public.shipment_labels FOR SELECT
  USING (shipment_id IN (
    SELECT s.id FROM public.shipments s 
    JOIN public.orders o ON s.order_id = o.id 
    WHERE o.user_id = auth.uid()
  ));

-- Fix RLS policies for assembly_jobs
CREATE POLICY "Users can view their own assembly jobs"
  ON public.assembly_jobs FOR SELECT
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- Fix function search paths by updating existing functions
CREATE OR REPLACE FUNCTION public.calculate_shipping_quote(
  p_packages JSONB,
  p_from_zone TEXT,
  p_to_zone TEXT,
  p_residential BOOLEAN DEFAULT FALSE,
  p_tail_lift BOOLEAN DEFAULT FALSE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
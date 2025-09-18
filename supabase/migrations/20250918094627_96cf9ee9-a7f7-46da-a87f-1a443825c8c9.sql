-- SECURITY FIXES - Phase 2: Address remaining linter warnings

-- 1. FIX REMAINING FUNCTIONS WITHOUT SEARCH_PATH PROTECTION
CREATE OR REPLACE FUNCTION public.initialize_order_approvals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create approval record when order is created
  INSERT INTO public.customer_approvals (
    order_id,
    signature_required,
    notes
  ) VALUES (
    NEW.id,
    false, -- Default to no signature required
    'Customer approval required before production can begin'
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_approvals_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if both key approvals are completed
  IF NEW.final_measurements_confirmed = true AND NEW.style_colour_finish_confirmed = true THEN
    -- Set completion timestamp if not already set
    IF NEW.all_approvals_completed_at IS NULL THEN
      NEW.all_approvals_completed_at = now();
      
      -- Update order production status to approved
      UPDATE public.orders 
      SET production_status = 'approved',
          updated_at = now()
      WHERE id = NEW.order_id;
      
      -- Log audit event
      PERFORM public.log_audit_event(
        p_actor_id := COALESCE(NEW.final_measurements_confirmed_by, NEW.style_colour_finish_confirmed_by),
        p_scope := 'order_approval',
        p_scope_id := NEW.order_id,
        p_action := 'approvals_completed',
        p_after_data := row_to_json(NEW)::text
      );
    END IF;
  ELSE
    -- Reset completion if approvals are unchecked
    NEW.all_approvals_completed_at = NULL;
    
    -- Reset order production status if needed
    UPDATE public.orders 
    SET production_status = 'awaiting_approval',
        updated_at = now()
    WHERE id = NEW.order_id AND production_status != 'awaiting_approval';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_shipping_quote(p_packages jsonb, p_from_zone text, p_to_zone text, p_residential boolean DEFAULT false, p_tail_lift boolean DEFAULT false)
RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.generate_milestone_invoices(p_order_id uuid)
RETURNS TABLE(invoice_id uuid, milestone_type text, amount numeric, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_deposit_invoice_id UUID;
  v_progress_invoice_id UUID;
  v_final_invoice_id UUID;
  v_deposit_amount NUMERIC;
  v_progress_amount NUMERIC;
  v_final_amount NUMERIC;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  v_deposit_amount := ROUND(v_order.total_amount * 0.20, 2);
  v_progress_amount := ROUND(v_order.total_amount * 0.30, 2);
  v_final_amount := v_order.total_amount - v_deposit_amount - v_progress_amount;

  INSERT INTO public.invoices (
    order_id, invoice_number, status, subtotal, gst_amount, total_amount,
    milestone_type, milestone_percentage, due_date
  ) VALUES (
    p_order_id,
    generate_invoice_number(),
    'draft',
    ROUND(v_deposit_amount / 1.10, 2),
    ROUND(v_deposit_amount * 0.10 / 1.10, 2),
    v_deposit_amount,
    'deposit',
    20.0,
    CURRENT_DATE + INTERVAL '7 days'
  ) RETURNING id INTO v_deposit_invoice_id;

  INSERT INTO public.invoices (
    order_id, invoice_number, status, subtotal, gst_amount, total_amount,
    milestone_type, milestone_percentage, due_date
  ) VALUES (
    p_order_id,
    generate_invoice_number(),
    'pending',
    ROUND(v_progress_amount / 1.10, 2),
    ROUND(v_progress_amount * 0.10 / 1.10, 2),
    v_progress_amount,
    'progress',
    30.0,
    CURRENT_DATE + INTERVAL '30 days'
  ) RETURNING id INTO v_progress_invoice_id;

  INSERT INTO public.invoices (
    order_id, invoice_number, status, subtotal, gst_amount, total_amount,
    milestone_type, milestone_percentage, due_date
  ) VALUES (
    p_order_id,
    generate_invoice_number(),
    'pending',
    ROUND(v_final_amount / 1.10, 2),
    ROUND(v_final_amount * 0.10 / 1.10, 2),
    v_final_amount,
    'final',
    50.0,
    CURRENT_DATE + INTERVAL '60 days'
  ) RETURNING id INTO v_final_invoice_id;

  RETURN QUERY 
  SELECT v_deposit_invoice_id, 'deposit'::TEXT, v_deposit_amount, 20.0::NUMERIC
  UNION ALL
  SELECT v_progress_invoice_id, 'progress'::TEXT, v_progress_amount, 30.0::NUMERIC
  UNION ALL
  SELECT v_final_invoice_id, 'final'::TEXT, v_final_amount, 50.0::NUMERIC;
END;
$$;

CREATE OR REPLACE FUNCTION public.attach_file_to_scope(p_file_id uuid, p_scope text, p_scope_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.file_attachments (file_id, scope, scope_id, attached_by)
  VALUES (p_file_id, p_scope, p_scope_id, auth.uid()) ON CONFLICT DO NOTHING;
END;
$$;
-- CRITICAL SECURITY FIXES - Phase 1 (Corrected)

-- 1. FIX QUOTE_REQUESTS TABLE CRITICAL VULNERABILITY
DROP POLICY IF EXISTS "Anyone can submit quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Admins can view all quote requests" ON public.quote_requests;

-- Ensure RLS is enabled
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Create secure policies for quote_requests
CREATE POLICY "Authenticated users can submit their own quote requests"
ON public.quote_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (user_id = auth.uid() OR user_id IS NULL)
);

CREATE POLICY "Authenticated admins can manage all quote requests"
ON public.quote_requests
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users can view their own quote requests"
ON public.quote_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
);

-- 2. SECURE ALL REMAINING DATABASE FUNCTIONS WITH SEARCH_PATH PROTECTION
CREATE OR REPLACE FUNCTION public.calculate_gst_amount(amount_ex_gst numeric, tax_rate numeric DEFAULT 0.10)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN ROUND(amount_ex_gst * tax_rate, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invoice_num TEXT;
BEGIN
    invoice_num := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || 
                   LPAD((SELECT COUNT(*) + 1 FROM invoices WHERE DATE(created_at) = CURRENT_DATE)::text, 4, '0');
    RETURN invoice_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    order_num text;
BEGIN
    order_num := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || 
                 LPAD((SELECT COUNT(*) + 1 FROM orders WHERE DATE(created_at) = CURRENT_DATE)::text, 4, '0');
    RETURN order_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_inventory_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only reduce inventory when order status changes to 'completed' or 'paid'
    IF NEW.status IN ('completed', 'paid') AND OLD.status != NEW.status THEN
        -- Update stock for each item in the order
        UPDATE cabinet_types 
        SET stock_quantity = stock_quantity - oi.quantity
        FROM order_items oi 
        WHERE cabinet_types.id = oi.cabinet_type_id 
        AND oi.order_id = NEW.id;
        
        -- Create inventory transactions
        INSERT INTO inventory_transactions (
            cabinet_type_id, 
            transaction_type, 
            quantity_change, 
            previous_stock,
            new_stock,
            reference_id,
            notes
        )
        SELECT 
            oi.cabinet_type_id,
            'sale',
            -oi.quantity,
            ct.stock_quantity + oi.quantity,
            ct.stock_quantity,
            NEW.id,
            'Order completion: ' || NEW.order_number
        FROM order_items oi
        JOIN cabinet_types ct ON ct.id = oi.cabinet_type_id
        WHERE oi.order_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

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

-- 3. ADD PROPER AUDIT LOGGING FOR QUOTE REQUESTS (INSERT/UPDATE/DELETE ONLY)
CREATE OR REPLACE FUNCTION public.audit_quote_requests_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to quote requests for security monitoring
  PERFORM public.log_audit_event(
    p_actor_id := auth.uid(),
    p_scope := 'quote_requests',
    p_scope_id := COALESCE(NEW.id, OLD.id),
    p_action := TG_OP,
    p_before_data := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::text ELSE NULL END,
    p_after_data := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::text ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create audit trigger for quote_requests (corrected - no SELECT)
CREATE TRIGGER audit_quote_requests_access
  AFTER INSERT OR UPDATE OR DELETE
  ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_quote_requests_access();
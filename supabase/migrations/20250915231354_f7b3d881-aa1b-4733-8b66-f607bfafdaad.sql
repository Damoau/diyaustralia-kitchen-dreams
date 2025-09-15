-- Fix RLS policies for new invoicing tables

-- RLS policies for contacts
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can manage all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Sales can manage all contacts" ON public.contacts;

CREATE POLICY "Users can view their own contacts" ON public.contacts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all contacts" ON public.contacts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales can manage all contacts" ON public.contacts
  FOR ALL USING (has_role(auth.uid(), 'sales_rep'::app_role));

-- RLS policies for invoice_lines
CREATE POLICY "Users can view their invoice lines" ON public.invoice_lines
  FOR SELECT USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i 
      JOIN public.orders o ON i.order_id = o.id 
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all invoice lines" ON public.invoice_lines
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales can manage invoice lines" ON public.invoice_lines
  FOR ALL USING (has_role(auth.uid(), 'sales_rep'::app_role));

-- RLS policies for payment_intents
CREATE POLICY "Users can view their payment intents" ON public.payment_intents
  FOR SELECT USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i 
      JOIN public.orders o ON i.order_id = o.id 
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payment intents" ON public.payment_intents
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales can manage payment intents" ON public.payment_intents
  FOR ALL USING (has_role(auth.uid(), 'sales_rep'::app_role));

-- RLS policies for payments_enhanced
CREATE POLICY "Users can view their payments" ON public.payments_enhanced
  FOR SELECT USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i 
      JOIN public.orders o ON i.order_id = o.id 
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payments" ON public.payments_enhanced
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales can manage payments" ON public.payments_enhanced
  FOR ALL USING (has_role(auth.uid(), 'sales_rep'::app_role));

-- RLS policies for credits
CREATE POLICY "Users can view their credits" ON public.credits
  FOR SELECT USING (
    contact_id IN (
      SELECT c.id FROM public.contacts c WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all credits" ON public.credits
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales can manage credits" ON public.credits
  FOR ALL USING (has_role(auth.uid(), 'sales_rep'::app_role));

-- RLS policies for credit_allocations
CREATE POLICY "Users can view their credit allocations" ON public.credit_allocations
  FOR SELECT USING (
    credit_id IN (
      SELECT cr.id FROM public.credits cr 
      JOIN public.contacts c ON cr.contact_id = c.id 
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all credit allocations" ON public.credit_allocations
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for xero_mappings (admin only)
CREATE POLICY "Admins can manage xero mappings" ON public.xero_mappings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active xero mappings" ON public.xero_mappings
  FOR SELECT USING (is_active = true);

-- RLS policies for xero_sync_status (admin only)
CREATE POLICY "Admins can manage sync status" ON public.xero_sync_status
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.calculate_gst_amount(amount_ex_gst NUMERIC, tax_rate NUMERIC DEFAULT 0.10)
RETURNS NUMERIC AS $$
BEGIN
  RETURN ROUND(amount_ex_gst * tax_rate, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_milestone_invoices(p_order_id UUID)
RETURNS TABLE (
  invoice_id UUID,
  milestone_type TEXT,
  amount NUMERIC,
  percentage NUMERIC
) AS $$
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
    public.generate_invoice_number(),
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
    public.generate_invoice_number(),
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
    public.generate_invoice_number(),
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
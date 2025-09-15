-- Step 11: Comprehensive Invoicing & Payments Database Schema

-- Create contacts table for customer information and Xero integration
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  xero_contact_id TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  abn TEXT,
  company_name TEXT,
  billing_address JSONB,
  shipping_address JSONB,
  payment_terms INTEGER DEFAULT 30, -- days
  credit_limit NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extend existing invoices table with comprehensive invoicing features
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id),
ADD COLUMN IF NOT EXISTS xero_invoice_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'AUD',
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS milestone_type TEXT, -- 'deposit', 'progress', 'final'
ADD COLUMN IF NOT EXISTS milestone_percentage NUMERIC,
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS purchase_order TEXT,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS void_reason TEXT,
ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES auth.users(id);

-- Create invoice_lines table for detailed line items
CREATE TABLE IF NOT EXISTS public.invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL DEFAULT 1,
  item_code TEXT,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price_ex_gst NUMERIC NOT NULL DEFAULT 0,
  unit_price_inc_gst NUMERIC NOT NULL DEFAULT 0,
  line_amount_ex_gst NUMERIC NOT NULL DEFAULT 0,
  line_amount_inc_gst NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0.10, -- 10% GST
  tax_amount NUMERIC DEFAULT 0,
  tax_code TEXT DEFAULT 'GST',
  account_code TEXT, -- Chart of accounts reference
  tracking_category_1 TEXT, -- e.g., Location
  tracking_category_2 TEXT, -- e.g., Product Line
  discount_rate NUMERIC DEFAULT 0,
  cabinet_type_id UUID REFERENCES public.cabinet_types(id),
  order_item_id UUID REFERENCES public.order_items(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(invoice_id, line_number)
);

-- Create payment_intents table for payment processing
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'stripe', 'paypal', 'pin_payments', 'manual'
  provider_intent_id TEXT UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'requires_payment', -- requires_payment, processing, requires_action, succeeded, failed, canceled
  client_secret TEXT, -- For Stripe/frontend integration
  payment_method_types TEXT[] DEFAULT '{"card"}',
  metadata JSONB,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table (extend existing or create new)
CREATE TABLE IF NOT EXISTS public.payments_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_intent_id UUID REFERENCES public.payment_intents(id),
  xero_payment_id TEXT UNIQUE,
  provider TEXT NOT NULL, -- 'stripe', 'paypal', 'pin_payments', 'manual', 'bank_transfer'
  provider_transaction_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  fee_amount NUMERIC DEFAULT 0,
  net_amount NUMERIC, -- amount - fee_amount
  payment_method TEXT, -- 'card', 'bank_transfer', 'apple_pay', 'google_pay'
  payment_method_details JSONB,
  status TEXT DEFAULT 'pending', -- pending, processing, succeeded, failed, refunded, partially_refunded
  reference TEXT,
  receipt_url TEXT,
  receipt_number TEXT,
  bank_reference TEXT, -- For bank transfers
  paid_at TIMESTAMPTZ,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create credits (credit notes) table
CREATE TABLE IF NOT EXISTS public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number TEXT UNIQUE NOT NULL,
  xero_credit_note_id TEXT UNIQUE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id),
  invoice_id UUID REFERENCES public.invoices(id), -- Original invoice being credited
  total_amount NUMERIC NOT NULL DEFAULT 0,
  gst_amount NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'draft', -- draft, authorised, paid, voided
  credit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT NOT NULL,
  notes TEXT,
  pdf_url TEXT,
  allocated_amount NUMERIC DEFAULT 0, -- How much has been allocated against invoices
  remaining_amount NUMERIC DEFAULT 0, -- Available for allocation
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create credit_allocations table for tracking credit note allocations
CREATE TABLE IF NOT EXISTS public.credit_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID NOT NULL REFERENCES public.credits(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  allocated_amount NUMERIC NOT NULL,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  allocated_by UUID REFERENCES auth.users(id),
  UNIQUE(credit_id, invoice_id)
);

-- Create xero_mappings table for configuration
CREATE TABLE IF NOT EXISTS public.xero_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'account', 'tax_code', 'tracking_category'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default Xero mapping values
INSERT INTO public.xero_mappings (setting_key, setting_value, description, category) 
VALUES 
  ('revenue_account_cabinets', '200', 'Sales - Cabinets', 'account'),
  ('revenue_account_doors', '210', 'Sales - Doors', 'account'),
  ('revenue_account_hardware', '220', 'Sales - Hardware', 'account'),
  ('revenue_account_freight', '230', 'Sales - Freight', 'account'),
  ('revenue_account_assembly', '240', 'Sales - Assembly', 'account'),
  ('expense_account_fees', '500', 'Payment Processing Fees', 'account'),
  ('rounding_account', '999', 'Rounding Account', 'account'),
  ('gst_tax_code', 'OUTPUT2', 'GST on Income', 'tax_code'),
  ('gst_free_tax_code', 'FRE', 'GST Free', 'tax_code'),
  ('tracking_category_location', 'Location', 'Tracking Category - Location', 'tracking_category'),
  ('tracking_category_product_line', 'Product Line', 'Tracking Category - Product Line', 'tracking_category')
ON CONFLICT (setting_key) DO NOTHING;

-- Create xero_sync_status table to track sync status
CREATE TABLE IF NOT EXISTS public.xero_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'contact', 'invoice', 'payment', 'credit'
  entity_id UUID NOT NULL,
  xero_id TEXT,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- pending, synced, error, out_of_sync
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_sync_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contacts
CREATE POLICY "Users can view their own contacts" ON public.contacts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all contacts" ON public.contacts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales can manage all contacts" ON public.contacts
  FOR ALL USING (has_role(auth.uid(), 'sales_rep'::app_role));

-- Create RLS policies for invoice_lines
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

-- Create RLS policies for payment_intents
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

-- Create RLS policies for payments_new
CREATE POLICY "Users can view their payments" ON public.payments_new
  FOR SELECT USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i 
      JOIN public.orders o ON i.order_id = o.id 
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payments" ON public.payments_new
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for credits
CREATE POLICY "Users can view their credits" ON public.credits
  FOR SELECT USING (
    contact_id IN (
      SELECT c.id FROM public.contacts c WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all credits" ON public.credits
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for xero_mappings (admin only)
CREATE POLICY "Admins can manage xero mappings" ON public.xero_mappings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active xero mappings" ON public.xero_mappings
  FOR SELECT USING (is_active = true);

-- Create RLS policies for xero_sync_status (admin only)
CREATE POLICY "Admins can manage sync status" ON public.xero_sync_status
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_xero_id ON public.contacts(xero_contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);

CREATE INDEX IF NOT EXISTS idx_invoices_contact_id ON public.invoices(contact_id);
CREATE INDEX IF NOT EXISTS idx_invoices_xero_id ON public.invoices(xero_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_milestone_type ON public.invoices(milestone_type);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON public.invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_cabinet_type ON public.invoice_lines(cabinet_type_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_order_item ON public.invoice_lines(order_item_id);

CREATE INDEX IF NOT EXISTS idx_payment_intents_invoice_id ON public.payment_intents(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_provider_id ON public.payment_intents(provider_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON public.payment_intents(status);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments_new(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_xero_id ON public.payments_new(xero_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments_new(status);

CREATE INDEX IF NOT EXISTS idx_credits_contact_id ON public.credits(contact_id);
CREATE INDEX IF NOT EXISTS idx_credits_invoice_id ON public.credits(invoice_id);
CREATE INDEX IF NOT EXISTS idx_credits_xero_id ON public.credits(xero_credit_note_id);

CREATE INDEX IF NOT EXISTS idx_xero_sync_entity ON public.xero_sync_status(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_xero_sync_status ON public.xero_sync_status(sync_status);

-- Create functions for milestone invoice generation
CREATE OR REPLACE FUNCTION public.calculate_gst_amount(amount_ex_gst NUMERIC, tax_rate NUMERIC DEFAULT 0.10)
RETURNS NUMERIC AS $$
BEGIN
  RETURN ROUND(amount_ex_gst * tax_rate, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate milestone invoices from orders
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
  -- Get order details
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Calculate milestone amounts (20% / 30% / 50%)
  v_deposit_amount := ROUND(v_order.total_amount * 0.20, 2);
  v_progress_amount := ROUND(v_order.total_amount * 0.30, 2);
  v_final_amount := v_order.total_amount - v_deposit_amount - v_progress_amount;

  -- Create deposit invoice (20%)
  INSERT INTO public.invoices (
    order_id, invoice_number, status, subtotal, gst_amount, total_amount,
    milestone_type, milestone_percentage, due_date
  ) VALUES (
    p_order_id,
    'INV-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD((SELECT COUNT(*) + 1 FROM invoices WHERE DATE(created_at) = CURRENT_DATE)::text, 4, '0'),
    'draft',
    ROUND(v_deposit_amount / 1.10, 2), -- Ex GST
    ROUND(v_deposit_amount * 0.10 / 1.10, 2), -- GST amount
    v_deposit_amount,
    'deposit',
    20.0,
    CURRENT_DATE + INTERVAL '7 days'
  ) RETURNING id INTO v_deposit_invoice_id;

  -- Create progress invoice (30%) - pending until triggered
  INSERT INTO public.invoices (
    order_id, invoice_number, status, subtotal, gst_amount, total_amount,
    milestone_type, milestone_percentage, due_date
  ) VALUES (
    p_order_id,
    'INV-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD((SELECT COUNT(*) + 1 FROM invoices WHERE DATE(created_at) = CURRENT_DATE)::text, 4, '0'),
    'pending',
    ROUND(v_progress_amount / 1.10, 2),
    ROUND(v_progress_amount * 0.10 / 1.10, 2),
    v_progress_amount,
    'progress',
    30.0,
    CURRENT_DATE + INTERVAL '30 days'
  ) RETURNING id INTO v_progress_invoice_id;

  -- Create final invoice (50%) - pending until triggered
  INSERT INTO public.invoices (
    order_id, invoice_number, status, subtotal, gst_amount, total_amount,
    milestone_type, milestone_percentage, due_date
  ) VALUES (
    p_order_id,
    'INV-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD((SELECT COUNT(*) + 1 FROM invoices WHERE DATE(created_at) = CURRENT_DATE)::text, 4, '0'),
    'pending',
    ROUND(v_final_amount / 1.10, 2),
    ROUND(v_final_amount * 0.10 / 1.10, 2),
    v_final_amount,
    'final',
    50.0,
    CURRENT_DATE + INTERVAL '60 days'
  ) RETURNING id INTO v_final_invoice_id;

  -- Return created invoices
  RETURN QUERY 
  SELECT v_deposit_invoice_id, 'deposit'::TEXT, v_deposit_amount, 20.0::NUMERIC
  UNION ALL
  SELECT v_progress_invoice_id, 'progress'::TEXT, v_progress_amount, 30.0::NUMERIC
  UNION ALL
  SELECT v_final_invoice_id, 'final'::TEXT, v_final_amount, 50.0::NUMERIC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_lines_updated_at
  BEFORE UPDATE ON public.invoice_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_intents_updated_at
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_new_updated_at
  BEFORE UPDATE ON public.payments_new
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON public.credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_xero_mappings_updated_at
  BEFORE UPDATE ON public.xero_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_xero_sync_status_updated_at
  BEFORE UPDATE ON public.xero_sync_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
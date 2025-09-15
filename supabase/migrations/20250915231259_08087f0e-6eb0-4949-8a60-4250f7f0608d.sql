-- Step 11: Comprehensive Invoicing & Payments Database Schema (Fixed)

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

-- Check and extend existing invoices table with comprehensive invoicing features
DO $$ 
BEGIN
  -- Add columns only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'contact_id') THEN
    ALTER TABLE public.invoices ADD COLUMN contact_id UUID REFERENCES public.contacts(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'xero_invoice_id') THEN
    ALTER TABLE public.invoices ADD COLUMN xero_invoice_id TEXT UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'currency') THEN
    ALTER TABLE public.invoices ADD COLUMN currency TEXT DEFAULT 'AUD';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'exchange_rate') THEN
    ALTER TABLE public.invoices ADD COLUMN exchange_rate NUMERIC DEFAULT 1.0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'terms') THEN
    ALTER TABLE public.invoices ADD COLUMN terms TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'discount_amount') THEN
    ALTER TABLE public.invoices ADD COLUMN discount_amount NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'discount_percentage') THEN
    ALTER TABLE public.invoices ADD COLUMN discount_percentage NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'shipping_amount') THEN
    ALTER TABLE public.invoices ADD COLUMN shipping_amount NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'notes') THEN
    ALTER TABLE public.invoices ADD COLUMN notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'internal_notes') THEN
    ALTER TABLE public.invoices ADD COLUMN internal_notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'milestone_type') THEN
    ALTER TABLE public.invoices ADD COLUMN milestone_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'milestone_percentage') THEN
    ALTER TABLE public.invoices ADD COLUMN milestone_percentage NUMERIC;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'reference') THEN
    ALTER TABLE public.invoices ADD COLUMN reference TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'purchase_order') THEN
    ALTER TABLE public.invoices ADD COLUMN purchase_order TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'sent_at') THEN
    ALTER TABLE public.invoices ADD COLUMN sent_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'void_reason') THEN
    ALTER TABLE public.invoices ADD COLUMN void_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'voided_at') THEN
    ALTER TABLE public.invoices ADD COLUMN voided_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'voided_by') THEN
    ALTER TABLE public.invoices ADD COLUMN voided_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Create remaining tables
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
  tax_rate NUMERIC DEFAULT 0.10,
  tax_amount NUMERIC DEFAULT 0,
  tax_code TEXT DEFAULT 'GST',
  account_code TEXT,
  tracking_category_1 TEXT,
  tracking_category_2 TEXT,
  discount_rate NUMERIC DEFAULT 0,
  cabinet_type_id UUID REFERENCES public.cabinet_types(id),
  order_item_id UUID REFERENCES public.order_items(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(invoice_id, line_number)
);

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_intent_id TEXT UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'requires_payment',
  client_secret TEXT,
  payment_method_types TEXT[] DEFAULT '{"card"}',
  metadata JSONB,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_intent_id UUID REFERENCES public.payment_intents(id),
  xero_payment_id TEXT UNIQUE,
  provider TEXT NOT NULL,
  provider_transaction_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  fee_amount NUMERIC DEFAULT 0,
  net_amount NUMERIC,
  payment_method TEXT,
  payment_method_details JSONB,
  status TEXT DEFAULT 'pending',
  reference TEXT,
  receipt_url TEXT,
  receipt_number TEXT,
  bank_reference TEXT,
  paid_at TIMESTAMPTZ,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number TEXT UNIQUE NOT NULL,
  xero_credit_note_id TEXT UNIQUE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id),
  invoice_id UUID REFERENCES public.invoices(id),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  gst_amount NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'draft',
  credit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT NOT NULL,
  notes TEXT,
  pdf_url TEXT,
  allocated_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID NOT NULL REFERENCES public.credits(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  allocated_amount NUMERIC NOT NULL,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  allocated_by UUID REFERENCES auth.users(id),
  UNIQUE(credit_id, invoice_id)
);

CREATE TABLE IF NOT EXISTS public.xero_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  category TEXT,
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

CREATE TABLE IF NOT EXISTS public.xero_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  xero_id TEXT,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- Enable RLS on new tables (only if not already enabled)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts') THEN
    ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_lines') THEN
    ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_intents') THEN
    ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments_enhanced') THEN
    ALTER TABLE public.payments_enhanced ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credits') THEN
    ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_allocations') THEN
    ALTER TABLE public.credit_allocations ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'xero_mappings') THEN
    ALTER TABLE public.xero_mappings ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'xero_sync_status') THEN
    ALTER TABLE public.xero_sync_status ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create GST calculation function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
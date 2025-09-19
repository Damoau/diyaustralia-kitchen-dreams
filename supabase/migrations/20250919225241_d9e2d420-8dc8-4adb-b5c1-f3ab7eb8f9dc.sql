-- CRITICAL SECURITY FIX: Secure Payment Tables RLS Policies
-- Remove potentially vulnerable public role policies and replace with authenticated-only policies

-- Fix payment_intents table
DROP POLICY IF EXISTS "Admins can manage all payment intents" ON public.payment_intents;
DROP POLICY IF EXISTS "Users can view their payment intents" ON public.payment_intents;

CREATE POLICY "Authenticated admins can manage payment intents" 
ON public.payment_intents 
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

CREATE POLICY "Authenticated users can view their payment intents" 
ON public.payment_intents 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  invoice_id IN (
    SELECT i.id
    FROM invoices i
    JOIN orders o ON i.order_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

-- Fix payment_schedules table
DROP POLICY IF EXISTS "Admins can manage all payment schedules" ON public.payment_schedules;
DROP POLICY IF EXISTS "Users can view their payment schedules" ON public.payment_schedules;

CREATE POLICY "Authenticated admins can manage payment schedules" 
ON public.payment_schedules 
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

CREATE POLICY "Authenticated users can view their payment schedules" 
ON public.payment_schedules 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can update their payment schedules" 
ON public.payment_schedules 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  )
);

-- Fix payments_new table (most critical - contains transaction details)
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments_new;
DROP POLICY IF EXISTS "Users can view their payments" ON public.payments_new;

CREATE POLICY "Authenticated admins can manage payments_new" 
ON public.payments_new 
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

CREATE POLICY "Authenticated users can view their payments_new" 
ON public.payments_new 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  invoice_id IN (
    SELECT i.id
    FROM invoices i
    JOIN orders o ON i.order_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

-- Strengthen existing payments table policies (already mostly secure but improve consistency)
DROP POLICY IF EXISTS "Users can view their order payments" ON public.payments;

CREATE POLICY "Authenticated users can view their order payments" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    -- User owns the order
    (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())) OR
    -- User owns the checkout
    (checkout_id IN (SELECT id FROM checkouts WHERE user_id = auth.uid())) OR
    -- User owns the payment schedule
    (payment_schedule_id IN (
      SELECT ps.id FROM payment_schedules ps
      JOIN orders o ON ps.order_id = o.id
      WHERE o.user_id = auth.uid()
    ))
  )
);

-- Add insert policy for payments table to allow users to create payments for their own orders
CREATE POLICY "Authenticated users can create payments for their orders" 
ON public.payments 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- User owns the order
    (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())) OR
    -- User owns the checkout
    (checkout_id IN (SELECT id FROM checkouts WHERE user_id = auth.uid())) OR
    -- User owns the payment schedule
    (payment_schedule_id IN (
      SELECT ps.id FROM payment_schedules ps
      JOIN orders o ON ps.order_id = o.id
      WHERE o.user_id = auth.uid()
    ))
  )
);

-- Add security audit triggers for all payment tables
CREATE OR REPLACE TRIGGER audit_payment_intents_access
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_data_access();

CREATE OR REPLACE TRIGGER audit_payment_schedules_access
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_schedules
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_data_access();

CREATE OR REPLACE TRIGGER audit_payments_access
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_data_access();

CREATE OR REPLACE TRIGGER audit_payments_enhanced_access
  AFTER INSERT OR UPDATE OR DELETE ON public.payments_enhanced
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_data_access();

CREATE OR REPLACE TRIGGER audit_payments_new_access
  AFTER INSERT OR UPDATE OR DELETE ON public.payments_new
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_data_access();

-- Create function to sanitize payment data for logging (removes sensitive info)
CREATE OR REPLACE FUNCTION public.log_payment_access(
  p_table_name text,
  p_action text,
  p_user_id uuid,
  p_payment_amount numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log payment access without exposing sensitive data
  PERFORM public.log_audit_event(
    p_actor_id := p_user_id,
    p_scope := p_table_name || '_access',
    p_action := p_action,
    p_after_data := json_build_object(
      'table', p_table_name,
      'action', p_action,
      'amount_category', CASE 
        WHEN p_payment_amount IS NULL THEN 'unknown'
        WHEN p_payment_amount < 100 THEN 'small'
        WHEN p_payment_amount < 1000 THEN 'medium'
        WHEN p_payment_amount < 10000 THEN 'large'
        ELSE 'very_large'
      END,
      'timestamp', now()
    )::text
  );
END;
$$;

-- Add constraints to prevent data exposure
ALTER TABLE public.payments_enhanced 
ADD CONSTRAINT check_payment_amount_positive 
CHECK (amount >= 0 AND amount <= 1000000);

ALTER TABLE public.payments_new 
ADD CONSTRAINT check_payment_amount_positive 
CHECK (amount >= 0 AND amount <= 1000000);

ALTER TABLE public.payment_intents 
ADD CONSTRAINT check_payment_amount_positive 
CHECK (amount >= 0 AND amount <= 1000000);

-- Revoke any potentially dangerous permissions from public role
REVOKE ALL ON public.payments FROM public;
REVOKE ALL ON public.payments_enhanced FROM public;
REVOKE ALL ON public.payments_new FROM public;
REVOKE ALL ON public.payment_intents FROM public;
REVOKE ALL ON public.payment_schedules FROM public;
-- SECURITY FIXES - Phase 3: Add missing RLS policies for remaining tables

-- 1. FIX CREDIT_ALLOCATIONS TABLE - Add RLS policies
CREATE POLICY "Admins can manage all credit allocations"
ON public.credit_allocations
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

-- Users can view credit allocations related to their invoices
CREATE POLICY "Users can view their own credit allocations"
ON public.credit_allocations
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  invoice_id IN (
    SELECT i.id FROM invoices i
    JOIN orders o ON i.order_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

-- 2. FIX PAYMENTS_ENHANCED TABLE - Add RLS policies
CREATE POLICY "Admins can manage all payments"
ON public.payments_enhanced
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

-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
ON public.payments_enhanced
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Allow access if payment is for user's order
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
    OR
    -- Allow access if payment is for user's invoice
    invoice_id IN (
      SELECT i.id FROM invoices i
      JOIN orders o ON i.order_id = o.id
      WHERE o.user_id = auth.uid()
    )
  )
);
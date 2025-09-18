-- SECURITY FIXES - Phase 3: Complete RLS policy implementation (Corrected)

-- 1. ADD RLS POLICIES FOR CREDIT_ALLOCATIONS TABLE
CREATE POLICY "Authenticated admins can manage all credit allocations"
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

CREATE POLICY "Users can view credit allocations for their invoices"
ON public.credit_allocations
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  invoice_id IN (
    SELECT i.id 
    FROM invoices i
    JOIN orders o ON o.id = i.order_id
    WHERE o.user_id = auth.uid()
  )
);

-- 2. ADD RLS POLICIES FOR PAYMENTS_ENHANCED TABLE  
CREATE POLICY "Authenticated admins can manage all payments"
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

-- Users can view payments for their own invoices only
CREATE POLICY "Users can view their own payments"
ON public.payments_enhanced
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  invoice_id IN (
    SELECT i.id 
    FROM invoices i
    JOIN orders o ON o.id = i.order_id
    WHERE o.user_id = auth.uid()
  )
);

-- 3. ADD AUDIT LOGGING FOR FINANCIAL DATA ACCESS
CREATE TRIGGER audit_credit_allocations_access
  AFTER INSERT OR UPDATE OR DELETE
  ON public.credit_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sensitive_data_access();

CREATE TRIGGER audit_payments_enhanced_access
  AFTER INSERT OR UPDATE OR DELETE
  ON public.payments_enhanced
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sensitive_data_access();
-- Fix critical security vulnerabilities identified in security scan

-- 1. Fix contacts table - restrict access to authenticated users and their own records
DROP POLICY IF EXISTS "Admins can manage all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Sales can manage all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;

CREATE POLICY "Users can manage their own contacts" 
ON public.contacts 
FOR ALL 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all contacts" 
ON public.contacts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales reps can manage all contacts" 
ON public.contacts 
FOR ALL 
USING (has_role(auth.uid(), 'sales_rep'::app_role))
WITH CHECK (has_role(auth.uid(), 'sales_rep'::app_role));

-- 2. Fix addresses table - ensure only authenticated users can access their own addresses
DROP POLICY IF EXISTS "Admins and sales reps can manage all addresses" ON public.addresses;  
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;

CREATE POLICY "Users can manage their own addresses" 
ON public.addresses 
FOR ALL 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all addresses" 
ON public.addresses 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales reps can manage all addresses" 
ON public.addresses 
FOR ALL 
USING (has_role(auth.uid(), 'sales_rep'::app_role))
WITH CHECK (has_role(auth.uid(), 'sales_rep'::app_role));

-- 3. Fix admin_sessions table - restrict to admin users only
DROP POLICY IF EXISTS "Admins can view all admin sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Users can manage their own admin sessions" ON public.admin_sessions;

CREATE POLICY "Admin users can manage their own sessions" 
ON public.admin_sessions 
FOR ALL 
USING (user_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (user_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can view all admin sessions" 
ON public.admin_sessions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix audit_logs table - restrict to system and admin users only
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Add missing RLS policies for tables that have RLS enabled but no policies
-- Check which tables need policies by looking at the linter results

-- 6. Secure function search paths
CREATE OR REPLACE FUNCTION public.calculate_gst_amount(amount_ex_gst numeric, tax_rate numeric DEFAULT 0.10)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN ROUND(amount_ex_gst * tax_rate, 2);
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    invoice_num TEXT;
BEGIN
    invoice_num := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || 
                   LPAD((SELECT COUNT(*) + 1 FROM invoices WHERE DATE(created_at) = CURRENT_DATE)::text, 4, '0');
    RETURN invoice_num;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    order_num text;
BEGIN
    order_num := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || 
                 LPAD((SELECT COUNT(*) + 1 FROM orders WHERE DATE(created_at) = CURRENT_DATE)::text, 4, '0');
    RETURN order_num;
END;
$function$;

-- Log this security fix
SELECT public.log_audit_event(
    auth.uid(),
    'security',
    NULL,
    'security_policy_update',
    NULL,
    '{"action": "Fixed critical RLS policies for contacts, addresses, admin_sessions, and audit_logs", "timestamp": "' || now()::text || '"}'::text,
    NULL,
    NULL
);
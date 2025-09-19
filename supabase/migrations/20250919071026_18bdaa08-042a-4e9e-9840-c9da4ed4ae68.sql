-- Fix quotes table RLS policies by removing problematic policy that accesses auth.users
DROP POLICY IF EXISTS "Users can view their quotes by email" ON quotes;

-- Create clean RLS policies for quotes table
DROP POLICY IF EXISTS "Anonymous users can view quotes by email" ON quotes;
DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON quotes;
DROP POLICY IF EXISTS "Admins can manage all quotes" ON quotes;

-- Admin access - comprehensive
CREATE POLICY "Admins can manage all quotes" 
ON quotes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Sales reps can manage all quotes
CREATE POLICY "Sales reps can manage all quotes" 
ON quotes 
FOR ALL 
USING (has_role(auth.uid(), 'sales_rep'::app_role))
WITH CHECK (has_role(auth.uid(), 'sales_rep'::app_role));

-- Users can view and update their own quotes (by user_id)
CREATE POLICY "Users can manage their own quotes" 
ON quotes 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Anonymous/session-based quote access (for customer portal)
CREATE POLICY "Session-based quote access" 
ON quotes 
FOR SELECT 
USING (auth.uid() IS NULL AND session_id IS NOT NULL);

-- Customer can view quotes by email (when authenticated and email matches)
CREATE POLICY "Authenticated users can view quotes by matching email" 
ON quotes 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
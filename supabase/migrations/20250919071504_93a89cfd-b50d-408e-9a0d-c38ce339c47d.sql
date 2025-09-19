-- Fix the quote_items table policies that are trying to access auth.users
DROP POLICY IF EXISTS "Users can view their quote items" ON quote_items;

-- Create proper policies for quote_items table
-- Admins can manage all quote items
CREATE POLICY "Admins can manage all quote items" 
ON quote_items 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Sales reps can manage all quote items
CREATE POLICY "Sales reps can manage all quote items" 
ON quote_items 
FOR ALL 
USING (has_role(auth.uid(), 'sales_rep'::app_role))
WITH CHECK (has_role(auth.uid(), 'sales_rep'::app_role));

-- Users can view quote items for quotes they own (by user_id)
CREATE POLICY "Users can view their own quote items" 
ON quote_items 
FOR SELECT 
USING (
  quote_id IN (
    SELECT id FROM quotes WHERE user_id = auth.uid()
  )
);
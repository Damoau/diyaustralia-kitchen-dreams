-- Check existing policies and drop only the problematic one, then create the correct one
DROP POLICY IF EXISTS "Users can view their quote items" ON quote_items;

-- Create a simple policy that doesn't reference auth.users
CREATE POLICY "Users can view quote items for their quotes" 
ON quote_items 
FOR SELECT 
USING (
  quote_id IN (
    SELECT id FROM quotes WHERE user_id = auth.uid()
  )
);
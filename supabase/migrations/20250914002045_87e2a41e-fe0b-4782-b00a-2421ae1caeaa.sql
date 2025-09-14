-- Fix cart_items RLS policy to prevent the same security vulnerability
-- The current policy allows any unauthenticated user to see all cart items for carts with session_id

-- Drop the existing overly permissive cart_items policy
DROP POLICY IF EXISTS "Users can manage their cart items" ON public.cart_items;

-- Create secure policies for cart_items
-- Only authenticated users can access their cart items through RLS
CREATE POLICY "Authenticated users can manage their cart items" 
ON public.cart_items 
FOR ALL 
TO authenticated
USING (cart_id IN (
  SELECT id FROM public.carts 
  WHERE user_id = auth.uid()
))
WITH CHECK (cart_id IN (
  SELECT id FROM public.carts 
  WHERE user_id = auth.uid()
));

-- For guest cart items, we'll handle through application logic and server functions
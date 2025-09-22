-- Fix RLS policies for messages table to use auth.email() instead of querying auth.users directly

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages for their quotes" ON public.messages;
DROP POLICY IF EXISTS "Users can insert change request messages" ON public.messages;

-- Create corrected policies using auth.email() instead of subquery to auth.users
CREATE POLICY "Users can view messages for their quotes" 
ON public.messages 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND scope = 'quote' 
    AND scope_id IN (
        SELECT quotes.id
        FROM quotes
        WHERE quotes.user_id = auth.uid() 
        OR quotes.customer_email = auth.email()
    )
);

CREATE POLICY "Users can insert change request messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND scope = 'quote' 
    AND message_type = 'change_request' 
    AND scope_id IN (
        SELECT quotes.id
        FROM quotes
        WHERE quotes.user_id = auth.uid() 
        OR quotes.customer_email = auth.email()
    )
);

-- Add policy for admins to manage all messages
CREATE POLICY "Admins can manage all messages" 
ON public.messages 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for admin replies
CREATE POLICY "Admins can insert admin replies" 
ON public.messages 
FOR INSERT 
WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    AND message_type = 'admin_reply'
);
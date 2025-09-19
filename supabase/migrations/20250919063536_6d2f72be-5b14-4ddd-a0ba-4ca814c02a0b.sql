-- Add missing fields to quotes table for admin quote creation
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS admin_created_by uuid;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_company text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_abn text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS viewed_at timestamp with time zone;

-- Create quote_notifications table for tracking notifications
CREATE TABLE IF NOT EXISTS public.quote_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'created', 'updated', 'reminder'
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_to text NOT NULL, -- email address
  status text NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'failed'
  template_used text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on quote_notifications
ALTER TABLE public.quote_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quote_notifications
CREATE POLICY "Admins can manage all quote notifications"
ON public.quote_notifications FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view notifications for their quotes"
ON public.quote_notifications FOR SELECT
TO authenticated
USING (quote_id IN (
  SELECT id FROM public.quotes 
  WHERE user_id = auth.uid()
));

-- Update existing quotes policies to allow email-based access for customers
DROP POLICY IF EXISTS "Users can manage their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;

CREATE POLICY "Users can view their own quotes"
ON public.quotes FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR customer_email = (auth.jwt() ->> 'email'));

CREATE POLICY "Users can update their own quotes"
ON public.quotes FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR customer_email = (auth.jwt() ->> 'email'));

CREATE POLICY "Anonymous users can view quotes by email"
ON public.quotes FOR SELECT
TO anon
USING (customer_email IS NOT NULL);
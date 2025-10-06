-- Create document_comments table for customer feedback
CREATE TABLE IF NOT EXISTS public.document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.order_documents(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  comment_text TEXT NOT NULL,
  comment_type TEXT NOT NULL CHECK (comment_type IN ('note', 'change_request', 'approval', 'question')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all comments
CREATE POLICY "Admins can manage document comments"
ON public.document_comments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Users can view comments on their orders
CREATE POLICY "Users can view comments on their orders"
ON public.document_comments
FOR SELECT
TO authenticated
USING (
  order_id IN (
    SELECT id FROM public.orders WHERE user_id = auth.uid()
  )
);

-- Users can create comments on their orders
CREATE POLICY "Users can create comments on their orders"
ON public.document_comments
FOR INSERT
TO authenticated
WITH CHECK (
  order_id IN (
    SELECT id FROM public.orders WHERE user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON public.document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_order_id ON public.document_comments(order_id);

-- Add updated_at trigger
CREATE TRIGGER update_document_comments_updated_at
  BEFORE UPDATE ON public.document_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
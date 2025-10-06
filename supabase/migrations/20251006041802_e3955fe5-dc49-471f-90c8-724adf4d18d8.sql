-- Add approval tracking fields to order_items table
ALTER TABLE public.order_items
ADD COLUMN drawing_approved boolean DEFAULT false,
ADD COLUMN drawing_approved_by uuid REFERENCES auth.users(id),
ADD COLUMN drawing_approved_at timestamp with time zone;

-- Create index for faster queries
CREATE INDEX idx_order_items_drawing_approved ON public.order_items(order_id, drawing_approved);

-- Create function to track cabinet approval
CREATE OR REPLACE FUNCTION public.approve_cabinet_drawing(
  p_order_item_id uuid,
  p_approved boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.order_items
  SET 
    drawing_approved = p_approved,
    drawing_approved_by = CASE WHEN p_approved THEN auth.uid() ELSE NULL END,
    drawing_approved_at = CASE WHEN p_approved THEN now() ELSE NULL END
  WHERE id = p_order_item_id;
  
  -- Log the approval action
  PERFORM public.log_audit_event(
    p_actor_id := auth.uid(),
    p_scope := 'order_items',
    p_scope_id := p_order_item_id,
    p_action := CASE WHEN p_approved THEN 'cabinet_drawing_approved' ELSE 'cabinet_drawing_unapproved' END,
    p_after_data := json_build_object(
      'approved', p_approved,
      'timestamp', now()
    )::text
  );
END;
$$;
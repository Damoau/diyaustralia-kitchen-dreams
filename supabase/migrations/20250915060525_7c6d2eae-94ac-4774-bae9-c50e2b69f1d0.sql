-- Create customer approvals system for orders
CREATE TABLE IF NOT EXISTS public.customer_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  final_measurements_confirmed BOOLEAN NOT NULL DEFAULT false,
  style_colour_finish_confirmed BOOLEAN NOT NULL DEFAULT false,
  final_measurements_confirmed_at TIMESTAMP WITH TIME ZONE,
  style_colour_finish_confirmed_at TIMESTAMP WITH TIME ZONE,
  final_measurements_confirmed_by UUID,
  style_colour_finish_confirmed_by UUID,
  signature_required BOOLEAN NOT NULL DEFAULT false,
  signature_data JSONB,
  signature_completed_at TIMESTAMP WITH TIME ZONE,
  all_approvals_completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_approvals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own order approvals" 
ON public.customer_approvals 
FOR SELECT 
USING (
  order_id IN (
    SELECT id FROM orders 
    WHERE user_id = auth.uid() OR (auth.uid() IS NULL AND session_id IS NOT NULL)
  )
);

CREATE POLICY "Users can update their own order approvals" 
ON public.customer_approvals 
FOR UPDATE 
USING (
  order_id IN (
    SELECT id FROM orders 
    WHERE user_id = auth.uid() OR (auth.uid() IS NULL AND session_id IS NOT NULL)
  )
);

CREATE POLICY "Admins can manage all customer approvals" 
ON public.customer_approvals 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customer_approvals_updated_at
BEFORE UPDATE ON public.customer_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add production_status to orders to track production gates
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS production_status TEXT DEFAULT 'awaiting_approval' 
CHECK (production_status IN (
  'awaiting_approval', 'approved', 'in_queue', 'cnc', 
  'edge_banding', 'paint', 'qc', 'packed', 'ready_to_ship', 'shipped'
));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customer_approvals_order_id ON public.customer_approvals(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_production_status ON public.orders(production_status);

-- Create function to check if all approvals are completed
CREATE OR REPLACE FUNCTION public.check_approvals_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if both key approvals are completed
  IF NEW.final_measurements_confirmed = true AND NEW.style_colour_finish_confirmed = true THEN
    -- Set completion timestamp if not already set
    IF NEW.all_approvals_completed_at IS NULL THEN
      NEW.all_approvals_completed_at = now();
      
      -- Update order production status to approved
      UPDATE public.orders 
      SET production_status = 'approved',
          updated_at = now()
      WHERE id = NEW.order_id;
      
      -- Log audit event
      PERFORM public.log_audit_event(
        p_actor_id := COALESCE(NEW.final_measurements_confirmed_by, NEW.style_colour_finish_confirmed_by),
        p_scope := 'order_approval',
        p_scope_id := NEW.order_id,
        p_action := 'approvals_completed',
        p_after_data := row_to_json(NEW)::text
      );
    END IF;
  ELSE
    -- Reset completion if approvals are unchecked
    NEW.all_approvals_completed_at = NULL;
    
    -- Reset order production status if needed
    UPDATE public.orders 
    SET production_status = 'awaiting_approval',
        updated_at = now()
    WHERE id = NEW.order_id AND production_status != 'awaiting_approval';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
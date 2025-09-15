-- Create trigger for the approvals completion check
CREATE TRIGGER check_approvals_completed_trigger
BEFORE UPDATE ON public.customer_approvals
FOR EACH ROW
EXECUTE FUNCTION public.check_approvals_completed();

-- Create function to initialize approvals for new orders
CREATE OR REPLACE FUNCTION public.initialize_order_approvals()
RETURNS TRIGGER AS $$
BEGIN
  -- Create approval record when order is created
  INSERT INTO public.customer_approvals (
    order_id,
    signature_required,
    notes
  ) VALUES (
    NEW.id,
    false, -- Default to no signature required
    'Customer approval required before production can begin'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-initialize approvals for new orders
CREATE TRIGGER initialize_order_approvals_trigger
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.initialize_order_approvals();
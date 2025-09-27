-- Cart Lifecycle Management Enhancement
-- Add new columns for comprehensive cart management

-- Add cart lifecycle and versioning columns
ALTER TABLE public.carts 
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_cart_id UUID REFERENCES public.carts(id),
ADD COLUMN IF NOT EXISTS quote_version TEXT,
ADD COLUMN IF NOT EXISTS lifecycle_state TEXT DEFAULT 'active' CHECK (lifecycle_state IN ('active', 'archived', 'converted', 'expired', 'draft')),
ADD COLUMN IF NOT EXISTS source_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archive_reason TEXT,
ADD COLUMN IF NOT EXISTS change_summary JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;

-- Update existing status values to use new lifecycle_state system
UPDATE public.carts SET lifecycle_state = 'archived' WHERE status = 'inactive';
UPDATE public.carts SET lifecycle_state = 'active' WHERE status = 'active';

-- Create index for efficient cart queries
CREATE INDEX IF NOT EXISTS idx_carts_lifecycle_activity ON public.carts(user_id, lifecycle_state, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_carts_session_lifecycle ON public.carts(session_id, lifecycle_state, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_carts_primary ON public.carts(user_id, is_primary) WHERE is_primary = true;

-- Function to enforce single primary cart per user
CREATE OR REPLACE FUNCTION public.ensure_single_primary_cart()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a cart as primary, unset all other primary carts for this user
  IF NEW.is_primary = true THEN
    IF NEW.user_id IS NOT NULL THEN
      UPDATE public.carts 
      SET is_primary = false, updated_at = now()
      WHERE user_id = NEW.user_id 
        AND id != NEW.id 
        AND is_primary = true;
    ELSIF NEW.session_id IS NOT NULL THEN
      UPDATE public.carts 
      SET is_primary = false, updated_at = now()
      WHERE session_id = NEW.session_id 
        AND id != NEW.id 
        AND is_primary = true;
    END IF;
  END IF;

  -- Update last activity timestamp
  NEW.last_activity_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary cart enforcement
DROP TRIGGER IF EXISTS enforce_single_primary_cart ON public.carts;
CREATE TRIGGER enforce_single_primary_cart
  BEFORE INSERT OR UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_primary_cart();

-- Function to auto-archive old carts
CREATE OR REPLACE FUNCTION public.auto_archive_old_carts()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER := 0;
BEGIN
  -- Archive carts older than 30 days without activity (except primary carts)
  UPDATE public.carts 
  SET 
    lifecycle_state = 'archived',
    auto_archived_at = now(),
    archive_reason = 'Auto-archived due to inactivity (30+ days)',
    is_primary = false,
    updated_at = now()
  WHERE 
    lifecycle_state = 'active'
    AND is_primary = false
    AND last_activity_at < (now() - interval '30 days')
    AND (SELECT COUNT(*) FROM cart_items WHERE cart_id = carts.id) = 0;
    
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Expire carts older than 90 days
  UPDATE public.carts 
  SET 
    lifecycle_state = 'expired',
    expiry_date = now(),
    updated_at = now()
  WHERE 
    lifecycle_state IN ('archived', 'active')
    AND last_activity_at < (now() - interval '90 days');
    
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's primary cart
CREATE OR REPLACE FUNCTION public.get_primary_cart(p_user_id UUID DEFAULT NULL, p_session_id TEXT DEFAULT NULL)
RETURNS TABLE(
  cart_id UUID,
  cart_name TEXT,
  total_amount NUMERIC,
  item_count BIGINT,
  lifecycle_state TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.total_amount,
    COALESCE((SELECT COUNT(*) FROM cart_items WHERE cart_id = c.id), 0),
    c.lifecycle_state,
    c.last_activity_at
  FROM public.carts c
  WHERE 
    (p_user_id IS NOT NULL AND c.user_id = p_user_id)
    OR (p_session_id IS NOT NULL AND c.session_id = p_session_id)
    AND c.lifecycle_state = 'active'
    AND c.is_primary = true
  ORDER BY c.last_activity_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create cart activity log table for audit trail
CREATE TABLE IF NOT EXISTS public.cart_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies for cart activity log
ALTER TABLE public.cart_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their cart activity" ON public.cart_activity_log
  FOR SELECT
  USING (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE user_id = auth.uid() OR (auth.uid() IS NULL AND session_id IS NOT NULL)
    )
  );

CREATE POLICY "System can insert cart activity" ON public.cart_activity_log
  FOR INSERT
  WITH CHECK (true);

-- Function to log cart activity
CREATE OR REPLACE FUNCTION public.log_cart_activity(
  p_cart_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.cart_activity_log (cart_id, user_id, action, details)
  VALUES (p_cart_id, auth.uid(), p_action, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update cart items trigger to log activity
CREATE OR REPLACE FUNCTION public.cart_items_activity_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_cart_activity(NEW.cart_id, 'item_added', json_build_object('item_id', NEW.id, 'quantity', NEW.quantity)::jsonb);
    -- Update cart activity timestamp
    UPDATE public.carts SET last_activity_at = now(), updated_at = now() WHERE id = NEW.cart_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_cart_activity(NEW.cart_id, 'item_updated', json_build_object('item_id', NEW.id, 'old_quantity', OLD.quantity, 'new_quantity', NEW.quantity)::jsonb);
    UPDATE public.carts SET last_activity_at = now(), updated_at = now() WHERE id = NEW.cart_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_cart_activity(OLD.cart_id, 'item_removed', json_build_object('item_id', OLD.id, 'quantity', OLD.quantity)::jsonb);
    UPDATE public.carts SET last_activity_at = now(), updated_at = now() WHERE id = OLD.cart_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cart items activity logging
DROP TRIGGER IF EXISTS cart_items_activity_log ON public.cart_items;
CREATE TRIGGER cart_items_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.cart_items_activity_trigger();
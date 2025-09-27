-- Drop existing problematic triggers first
DROP TRIGGER IF EXISTS enforce_single_primary_cart ON public.carts;
DROP TRIGGER IF EXISTS update_cart_activity_trigger ON public.carts;

-- Add cart lifecycle columns without triggers
ALTER TABLE public.carts 
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_cart_id UUID REFERENCES public.carts(id),
ADD COLUMN IF NOT EXISTS quote_version TEXT,
ADD COLUMN IF NOT EXISTS lifecycle_state TEXT DEFAULT 'active' CHECK (lifecycle_state IN ('active', 'archived', 'converted', 'expired', 'draft')),
ADD COLUMN IF NOT EXISTS source_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Update existing data
UPDATE public.carts SET lifecycle_state = 'archived' WHERE status = 'inactive';
UPDATE public.carts SET lifecycle_state = 'active' WHERE status = 'active';

-- Set one cart per user as primary (most recent active cart)
WITH primary_carts AS (
  SELECT DISTINCT ON (COALESCE(user_id::text, session_id)) 
    id, user_id, session_id
  FROM public.carts 
  WHERE lifecycle_state = 'active'
  ORDER BY COALESCE(user_id::text, session_id), last_activity_at DESC
)
UPDATE public.carts 
SET is_primary = true 
WHERE id IN (SELECT id FROM primary_carts);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_carts_lifecycle_activity ON public.carts(user_id, lifecycle_state, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_carts_session_lifecycle ON public.carts(session_id, lifecycle_state, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_carts_primary ON public.carts(user_id, is_primary) WHERE is_primary = true;

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
    ((p_user_id IS NOT NULL AND c.user_id = p_user_id)
    OR (p_session_id IS NOT NULL AND c.session_id = p_session_id))
    AND c.lifecycle_state = 'active'
    AND c.is_primary = true
  ORDER BY c.last_activity_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to manage primary cart (called programmatically)
CREATE OR REPLACE FUNCTION public.set_primary_cart(p_cart_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_session_id TEXT;
BEGIN
  -- Get cart owner info
  SELECT user_id, session_id INTO v_user_id, v_session_id
  FROM public.carts WHERE id = p_cart_id;
  
  -- Unset all other primary carts for this user/session
  IF v_user_id IS NOT NULL THEN
    UPDATE public.carts 
    SET is_primary = false, updated_at = now()
    WHERE user_id = v_user_id AND id != p_cart_id;
  ELSIF v_session_id IS NOT NULL THEN
    UPDATE public.carts 
    SET is_primary = false, updated_at = now()
    WHERE session_id = v_session_id AND id != p_cart_id;
  END IF;
  
  -- Set this cart as primary
  UPDATE public.carts 
  SET is_primary = true, last_activity_at = now(), updated_at = now()
  WHERE id = p_cart_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced cart consolidation function
CREATE OR REPLACE FUNCTION public.enhanced_cart_consolidation(p_user_id UUID DEFAULT NULL, p_session_id TEXT DEFAULT NULL)
RETURNS TABLE(
  action TEXT,
  cart_count INTEGER,
  details TEXT
) AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_empty_count INTEGER := 0;
  v_archived_count INTEGER := 0;
  v_primary_cart_id UUID;
BEGIN
  -- Archive empty carts older than 1 day
  UPDATE public.carts 
  SET lifecycle_state = 'archived', is_primary = false, updated_at = now()
  WHERE 
    ((v_user_id IS NOT NULL AND user_id = v_user_id) OR 
     (p_session_id IS NOT NULL AND session_id = p_session_id))
    AND lifecycle_state = 'active'
    AND (SELECT COUNT(*) FROM cart_items WHERE cart_id = carts.id) = 0
    AND last_activity_at < (now() - interval '1 day');
    
  GET DIAGNOSTICS v_empty_count = ROW_COUNT;
  
  -- Archive old non-primary carts with items (older than 30 days)
  UPDATE public.carts 
  SET lifecycle_state = 'archived', is_primary = false, updated_at = now()
  WHERE 
    ((v_user_id IS NOT NULL AND user_id = v_user_id) OR 
     (p_session_id IS NOT NULL AND session_id = p_session_id))
    AND lifecycle_state = 'active'
    AND is_primary = false
    AND last_activity_at < (now() - interval '30 days');
    
  GET DIAGNOSTICS v_archived_count = ROW_COUNT;
  
  -- Ensure there's exactly one primary cart
  SELECT id INTO v_primary_cart_id
  FROM public.carts
  WHERE 
    ((v_user_id IS NOT NULL AND user_id = v_user_id) OR 
     (p_session_id IS NOT NULL AND session_id = p_session_id))
    AND lifecycle_state = 'active'
    AND is_primary = true
  LIMIT 1;
  
  -- If no primary cart, set the most recent active cart as primary
  IF v_primary_cart_id IS NULL THEN
    SELECT id INTO v_primary_cart_id
    FROM public.carts
    WHERE 
      ((v_user_id IS NOT NULL AND user_id = v_user_id) OR 
       (p_session_id IS NOT NULL AND session_id = p_session_id))
      AND lifecycle_state = 'active'
    ORDER BY last_activity_at DESC
    LIMIT 1;
    
    IF v_primary_cart_id IS NOT NULL THEN
      PERFORM public.set_primary_cart(v_primary_cart_id);
    END IF;
  END IF;
  
  -- Return results
  RETURN QUERY VALUES 
    ('archived_empty'::TEXT, v_empty_count, format('Archived %s empty carts', v_empty_count)),
    ('archived_old'::TEXT, v_archived_count, format('Archived %s old carts', v_archived_count)),
    ('primary_set'::TEXT, 1, format('Primary cart: %s', COALESCE(v_primary_cart_id::TEXT, 'none')));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Phase 1 Continued: Fix Function Search Path Security Issues
-- Add search_path to all SECURITY DEFINER functions that are missing it

-- Fix ensure_single_primary_cart trigger function
CREATE OR REPLACE FUNCTION public.ensure_single_primary_cart()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
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
$$;

-- Fix log_cart_activity (SECURITY DEFINER - Critical)
CREATE OR REPLACE FUNCTION public.log_cart_activity(p_cart_id uuid, p_action text, p_details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.cart_activity_log (cart_id, user_id, action, details)
  VALUES (p_cart_id, auth.uid(), p_action, p_details);
END;
$$;

-- Fix cart_items_activity_trigger
CREATE OR REPLACE FUNCTION public.cart_items_activity_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
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
$$;

-- Fix get_primary_cart
CREATE OR REPLACE FUNCTION public.get_primary_cart(p_user_id uuid DEFAULT NULL, p_session_id text DEFAULT NULL)
RETURNS TABLE(cart_id uuid, cart_name text, total_amount numeric, item_count bigint, lifecycle_state text, last_activity_at timestamp with time zone)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
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
$$;

-- Fix set_primary_cart (SECURITY DEFINER - Critical)
CREATE OR REPLACE FUNCTION public.set_primary_cart(p_cart_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Fix enhanced_cart_consolidation (SECURITY DEFINER - Critical)
CREATE OR REPLACE FUNCTION public.enhanced_cart_consolidation(p_user_id uuid DEFAULT NULL, p_session_id text DEFAULT NULL)
RETURNS TABLE(action text, cart_count integer, details text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;
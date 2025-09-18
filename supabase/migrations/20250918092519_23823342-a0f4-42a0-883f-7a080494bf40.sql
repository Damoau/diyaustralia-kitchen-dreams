-- Security Enhancement: Fix database function security settings
-- Update all database functions to include proper search_path settings

-- Fix has_role function security
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- Fix log_audit_event function security
CREATE OR REPLACE FUNCTION public.log_audit_event(p_actor_id uuid DEFAULT NULL::uuid, p_scope text DEFAULT NULL::text, p_scope_id uuid DEFAULT NULL::uuid, p_action text DEFAULT NULL::text, p_before_data text DEFAULT NULL::text, p_after_data text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $$
BEGIN
  -- Insert audit log entry if audit_logs table exists
  BEGIN
    INSERT INTO public.audit_logs (
      actor_id,
      scope,
      scope_id,
      action,
      before_data,
      after_data,
      ip_address,
      user_agent
    )
    VALUES (
      p_actor_id,
      p_scope,
      p_scope_id,
      p_action,
      CASE WHEN p_before_data IS NOT NULL THEN p_before_data::jsonb ELSE NULL END,
      CASE WHEN p_after_data IS NOT NULL THEN p_after_data::jsonb ELSE NULL END,
      p_ip_address,
      p_user_agent
    );
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist, silently ignore
      RETURN;
  END;
END;
$$;

-- Fix check_approvals_completed function security
CREATE OR REPLACE FUNCTION public.check_approvals_completed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $$
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
$$;

-- Fix initialize_order_approvals function security
CREATE OR REPLACE FUNCTION public.initialize_order_approvals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $$
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
$$;

-- Fix update_updated_at_column function security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
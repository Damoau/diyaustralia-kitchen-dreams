-- Create RPC function for audit logging to bypass type issues
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_actor_id UUID DEFAULT NULL,
  p_scope TEXT DEFAULT NULL,
  p_scope_id UUID DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_before_data TEXT DEFAULT NULL,
  p_after_data TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
-- Fix function search path security issue
CREATE OR REPLACE FUNCTION log_admin_audit(
    p_table_name text,
    p_record_id uuid,
    p_action text,
    p_old_values jsonb DEFAULT NULL,
    p_new_values jsonb DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        actor_id,
        old_values,
        new_values,
        metadata
    ) VALUES (
        p_table_name,
        p_record_id,
        p_action,
        auth.uid(),
        p_old_values,
        p_new_values,
        p_metadata
    );
END;
$$;
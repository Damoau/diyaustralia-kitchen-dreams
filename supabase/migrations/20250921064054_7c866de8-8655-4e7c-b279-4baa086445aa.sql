-- Fix the audit_logs table schema issues
-- Make table_name nullable since log_audit_event function doesn't populate it
ALTER TABLE audit_logs ALTER COLUMN table_name DROP NOT NULL;

-- Create a proper audit function for quotes (separate from quote_requests)
CREATE OR REPLACE FUNCTION public.audit_quotes_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log access to quotes for security monitoring
  PERFORM public.log_audit_event(
    p_actor_id := auth.uid(),
    p_scope := 'quotes',
    p_scope_id := COALESCE(NEW.id, OLD.id),
    p_action := TG_OP,
    p_before_data := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::text ELSE NULL END,
    p_after_data := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::text ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Drop the incorrect trigger if it exists
DROP TRIGGER IF EXISTS audit_quote_requests_access_trigger ON quotes;

-- Create the correct trigger for quotes table
CREATE TRIGGER audit_quotes_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON quotes
  FOR EACH ROW EXECUTE FUNCTION audit_quotes_access();
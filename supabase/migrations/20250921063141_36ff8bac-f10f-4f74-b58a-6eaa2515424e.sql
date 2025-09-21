-- Add missing 'scope' column to audit_logs table to fix quote creation error
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS scope text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS scope_id uuid;

-- Update the audit_logs table to match the log_audit_event function expectations
-- The function expects scope, scope_id parameters but table had table_name, record_id
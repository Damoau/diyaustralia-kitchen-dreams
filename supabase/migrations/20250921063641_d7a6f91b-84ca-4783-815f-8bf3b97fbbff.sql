-- Fix audit_logs table to match the log_audit_event function expectations
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS before_data jsonb;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS after_data jsonb;

-- The function expects these column names but table had different ones
-- Update the function to match the table structure or add missing columns
-- Since the function uses before_data/after_data, let's add those columns
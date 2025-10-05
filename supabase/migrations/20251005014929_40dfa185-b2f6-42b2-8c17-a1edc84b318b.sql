-- Add IP address tracking to admin impersonation sessions
ALTER TABLE admin_impersonation_sessions 
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Create security_events table for CSP violations and other security monitoring
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on security_events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events"
ON security_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert security events (service role)
CREATE POLICY "System can insert security events"
ON security_events
FOR INSERT
WITH CHECK (true);

-- Create index for efficient querying of security events
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);

-- Add comment to table
COMMENT ON TABLE security_events IS 'Security monitoring events including CSP violations, suspicious activity, and other security alerts';
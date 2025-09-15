-- 6.5 Security & Compliance: Create audit_logs table for tracking checkout events
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id),
  scope TEXT NOT NULL, -- 'checkout', 'order', 'quote', etc.
  scope_id UUID, -- checkout_id, order_id, etc.
  action TEXT NOT NULL, -- 'checkout.identify.completed', 'order.created', etc.
  before_data JSONB,
  after_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- 6.6 Admin Settings: Create admin_settings table for identity configuration
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_settings
CREATE POLICY "Admins can manage admin settings" 
ON public.admin_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default admin settings for identity
INSERT INTO public.admin_settings (setting_key, setting_value, description, category) VALUES
('allow_guest_checkout', 'true', 'Allow customers to checkout as guests without creating accounts', 'identity'),
('allow_guest_with_existing_email', 'true', 'Allow guest checkout even when email already has an account', 'identity'),
('require_phone_number', 'true', 'Require phone number during checkout identify step', 'identity'),
('auth_methods', '["password", "magic_link", "otp_email"]', 'Enabled authentication methods', 'identity'),
('marketing_opt_in_default', 'false', 'Default state of marketing opt-in checkbox', 'identity');

-- 6.11 Data Model Additions: Add verification fields to users and create verification_tokens
-- Note: We can't modify auth.users directly, so we'll use profiles table and verification_tokens

-- Add verification timestamps to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Create verification_tokens table (if not exists)
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on verification_tokens
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for verification_tokens
CREATE POLICY "Admins can manage all verification tokens" 
ON public.verification_tokens 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own verification tokens" 
ON public.verification_tokens 
FOR ALL 
USING ((auth.uid() = user_id) OR (email = auth.email()));

-- Add updated_at trigger to admin_settings
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_scope_id ON public.audit_logs(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON public.verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_email ON public.verification_tokens(email);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON public.verification_tokens(expires_at);
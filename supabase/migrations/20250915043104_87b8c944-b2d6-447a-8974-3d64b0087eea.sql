-- Create verification tokens table for OTP and magic links
CREATE TABLE public.verification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checkouts table
CREATE TABLE public.checkouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID REFERENCES carts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'abandoned', 'converted')),
  customer_email TEXT,
  customer_phone TEXT,
  customer_first_name TEXT,
  customer_last_name TEXT,
  customer_company TEXT,
  customer_abn TEXT,
  how_heard TEXT,
  accept_terms BOOLEAN DEFAULT false,
  accept_privacy BOOLEAN DEFAULT false,
  marketing_opt_in BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '2 hours')
);

-- Create checkout_quotes table for quote attachments
CREATE TABLE public.checkout_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_id UUID NOT NULL REFERENCES checkouts(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL, -- Reference to quote system
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add email_verified_at and phone_verified_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Enable RLS on new tables
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for verification_tokens
CREATE POLICY "Users can manage their own verification tokens" 
ON public.verification_tokens 
FOR ALL 
USING (auth.uid() = user_id OR email = auth.email());

CREATE POLICY "Admins can manage all verification tokens" 
ON public.verification_tokens 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for checkouts
CREATE POLICY "Users can manage their own checkouts" 
ON public.checkouts 
FOR ALL 
USING (auth.uid() = user_id OR (auth.uid() IS NULL AND session_id IS NOT NULL));

CREATE POLICY "Admins can manage all checkouts" 
ON public.checkouts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for checkout_quotes
CREATE POLICY "Users can view their checkout quotes" 
ON public.checkout_quotes 
FOR SELECT 
USING (checkout_id IN (
  SELECT id FROM checkouts 
  WHERE auth.uid() = user_id OR (auth.uid() IS NULL AND session_id IS NOT NULL)
));

CREATE POLICY "Admins can manage all checkout quotes" 
ON public.checkout_quotes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_checkouts_updated_at
BEFORE UPDATE ON public.checkouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_verification_tokens_email ON verification_tokens(email);
CREATE INDEX idx_verification_tokens_expires_at ON verification_tokens(expires_at);
CREATE INDEX idx_checkouts_user_id ON checkouts(user_id);
CREATE INDEX idx_checkouts_session_id ON checkouts(session_id);
CREATE INDEX idx_checkouts_status ON checkouts(status);
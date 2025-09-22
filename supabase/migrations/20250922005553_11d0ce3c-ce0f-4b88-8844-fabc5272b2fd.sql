-- Add missing columns to messages table for quote change requests
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS extension TEXT;

-- Update existing messages to have default values
UPDATE public.messages 
SET topic = 'General Message', extension = 'system' 
WHERE topic IS NULL OR extension IS NULL;
-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule document reminders to run daily at 9 AM AEST
SELECT cron.schedule(
  'send-document-reminders-daily',
  '0 9 * * *', -- Every day at 9 AM
  $$
  SELECT
    net.http_post(
      url := 'https://nqxsfmnvdfdfvndrodvs.supabase.co/functions/v1/send-document-reminders',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xeHNmbW52ZGZkZnZuZHJvZHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjc0MTksImV4cCI6MjA3MjcwMzQxOX0.XohXpJo_kwqtL7fgRbITjW6cq_atc97V6PfUArks-t0"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Add helpful comment
COMMENT ON EXTENSION pg_cron IS 'Automated job scheduler for document reminders and other periodic tasks';

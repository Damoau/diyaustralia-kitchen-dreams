# Cron Specifications for Security & Maintenance Jobs

## Supabase Cron Jobs Configuration

### 1. Data Retention Job
```sql
-- Run daily at 2 AM AEDT (15:00 UTC during DST, 16:00 UTC during standard time)
SELECT cron.schedule(
  'data-retention-daily',
  '0 16 * * *', -- 2 AM AEDT (adjust for DST)
  $$
  SELECT
    net.http_post(
        url:='https://nqxsfmnvdfdfvndrodvs.supabase.co/functions/v1/data-retention-job',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xeHNmbW52ZGZkZnZuZHJvZHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjc0MTksImV4cCI6MjA3MjcwMzQxOX0.XohXpJo_kwqtL7fgRbITjW6cq_atc97V6PfUArks-t0"}'::jsonb,
        body:='{"trigger": "cron", "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);
```

### 2. Security Audit Job  
```sql
-- Run every 6 hours for security monitoring
SELECT cron.schedule(
  'security-audit-6hourly',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://nqxsfmnvdfdfvndrodvs.supabase.co/functions/v1/security-audit-job',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xeHNmbW52ZGZkZnZuZHJvZHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjc0MTksImV4cCI6MjA3MjcwMzQxOX0.XohXpJo_kwqtL7fgRbITjW6cq_atc97V6PfUArks-t0"}'::jsonb,
        body:='{"trigger": "cron", "audit_type": "security_scan"}'::jsonb
    ) as request_id;
  $$
);
```

### 3. Secret Rotation Reminder
```sql
-- Run weekly on Sundays at 10 AM AEDT
SELECT cron.schedule(
  'secret-rotation-reminder',
  '0 23 * * 0', -- 10 AM AEDT on Sundays
  $$
  SELECT
    net.http_post(
        url:='https://nqxsfmnvdfdfvndrodvs.supabase.co/functions/v1/secret-rotation-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xeHNmbW52ZGZkZnZuZHJvZHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjc0MTksImV4cCI6MjA3MjcwMzQxOX0.XohXpJo_kwqtL7fgRbITjW6cq_atc97V6PfUArks-t0"}'::jsonb,
        body:='{"trigger": "cron", "check_type": "rotation_due"}'::jsonb
    ) as request_id;
  $$
);
```

### 4. Backup Verification Job
```sql
-- Run daily at 3 AM AEDT for backup verification
SELECT cron.schedule(
  'backup-verification-daily',
  '0 17 * * *', -- 3 AM AEDT
  $$
  SELECT
    net.http_post(
        url:='https://nqxsfmnvdfdfvndrodvs.supabase.co/functions/v1/backup-verification',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xeHNmbW52ZGZkZnZuZHJvZHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjc0MTksImV4cCI6MjA3MjcwMzQxOX0.XohXpJo_kwqtL7fgRbITjW6cq_atc97V6PfUArks-t0"}'::jsonb,
        body:='{"trigger": "cron", "verification_type": "full"}'::jsonb
    ) as request_id;
  $$
);
```

### 5. Cleanup Abandoned Carts
```sql
-- Run every 4 hours to clean up abandoned carts
SELECT cron.schedule(
  'cleanup-abandoned-carts',
  '0 */4 * * *',
  $$
  UPDATE carts 
  SET status = 'abandoned' 
  WHERE status = 'active' 
    AND updated_at < NOW() - INTERVAL '24 hours';
  $$
);
```

## Job Management Commands

### Enable pg_cron Extension
```sql
-- Run this once to enable cron functionality
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### List All Scheduled Jobs
```sql
SELECT * FROM cron.job ORDER BY jobname;
```

### Remove a Job
```sql
SELECT cron.unschedule('job-name-here');
```

### View Job Execution History
```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'data-retention-daily' 
ORDER BY start_time DESC 
LIMIT 10;
```

## Cron Expression Reference

| Field | Range | Special Characters |
|-------|-------|-------------------|
| Minute | 0-59 | * , - / |
| Hour | 0-23 | * , - / |
| Day of Month | 1-31 | * , - / ? L W |
| Month | 1-12 | * , - / |
| Day of Week | 0-7 | * , - / ? L # |

### Common Patterns
- `0 2 * * *` - Daily at 2 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 0 1 * *` - Monthly on the 1st at midnight
- `*/15 * * * *` - Every 15 minutes

## Monitoring & Alerting

### Job Failure Notifications
```sql
-- Create function to send alerts on job failures
CREATE OR REPLACE FUNCTION notify_job_failure()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'failed' THEN
    -- Send notification to monitoring system
    PERFORM net.http_post(
      url := 'https://hooks.slack.com/your-webhook-url',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'text', 'Cron job failed: ' || NEW.jobname,
        'timestamp', NEW.start_time
      )::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to job run details
CREATE TRIGGER job_failure_notification
  AFTER INSERT ON cron.job_run_details
  FOR EACH ROW
  EXECUTE FUNCTION notify_job_failure();
```

### Health Check Query
```sql
-- Check for failed jobs in the last 24 hours
SELECT 
  jobname,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE start_time > NOW() - INTERVAL '24 hours'
  AND status = 'failed'
ORDER BY start_time DESC;
```

## Best Practices

### 1. Error Handling
- Always include proper error handling in edge functions
- Log all job executions to audit trail
- Set up alerting for job failures

### 2. Resource Management
- Schedule resource-intensive jobs during off-peak hours
- Use connection pooling for database operations
- Implement circuit breakers for external API calls

### 3. Security Considerations
- Use service role keys for cron job authentication
- Validate all inputs in edge functions
- Log all actions for audit compliance

### 4. Testing & Validation
- Test all cron jobs in development environment first
- Implement dry-run modes for destructive operations
- Validate job execution times and resource usage

## Timezone Considerations

### Australian Eastern Time (AEDT/AEST)
- **AEDT (Daylight Saving)**: UTC+11 (October - April)
- **AEST (Standard Time)**: UTC+10 (April - October)

### Cron Time Adjustments
```sql
-- Dynamic timezone-aware scheduling
SELECT cron.schedule(
  'timezone-aware-job',
  CASE 
    WHEN EXTRACT(month FROM NOW()) BETWEEN 4 AND 9 
    THEN '0 16 * * *'  -- AEST: 2 AM = UTC 16:00
    ELSE '0 15 * * *'  -- AEDT: 2 AM = UTC 15:00
  END,
  $$ SELECT 'job content here'; $$
);
```

---
**Last Updated**: 2024-01-15  
**Next Review**: 2024-04-15  
**Owner**: DevOps Team
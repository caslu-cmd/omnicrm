-- Add media_urls column to scheduled_posts if not present
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT NULL;

-- Remove existing job before (re)creating to allow idempotency
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'publish-scheduled-posts';

-- Trigger publish-scheduled every 5 minutes via pg_net HTTP POST
SELECT cron.schedule(
  'publish-scheduled-posts',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url    := 'https://proldgiyterqhthludlp.supabase.co/functions/v1/publish-scheduled',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body   := '{}'::jsonb
  ) AS request_id;
  $$
);

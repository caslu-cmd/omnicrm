-- Perfil de cada cliente para acesso server-side (sem depender do localStorage)
CREATE TABLE IF NOT EXISTS public.client_profiles (
  client_id    text        NOT NULL,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text        NOT NULL DEFAULT '',
  industry     text        NOT NULL DEFAULT '',
  nicho        text        NOT NULL DEFAULT '',
  brand_color  text        NOT NULL DEFAULT '#B9FF4B',
  logo_url     text        NOT NULL DEFAULT '',
  platforms    text[]      NOT NULL DEFAULT ARRAY['instagram'],
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, user_id)
);

ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own client profiles"
  ON public.client_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Log de demandas enviadas (UI, WhatsApp, webhook, etc.)
CREATE TABLE IF NOT EXISTS public.demand_inbox (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       text        NOT NULL,
  user_id         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  demand          text        NOT NULL,
  platforms       text[]      NOT NULL DEFAULT ARRAY['instagram'],
  status          text        NOT NULL DEFAULT 'processing'
                              CHECK (status IN ('processing', 'done', 'failed')),
  scheduled_count int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own demands"
  ON public.demand_inbox FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access demands"
  ON public.demand_inbox FOR ALL
  USING (auth.role() = 'service_role');

-- Cron: dispara auto-calendar-dispatch todos os dias às 7h Brasília (10h UTC)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'auto-calendar-dispatch';

SELECT cron.schedule(
  'auto-calendar-dispatch',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://proldgiyterqhthludlp.supabase.co/functions/v1/auto-calendar-dispatch',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

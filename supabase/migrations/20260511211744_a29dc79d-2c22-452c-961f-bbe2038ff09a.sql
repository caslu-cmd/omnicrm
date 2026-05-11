
CREATE TABLE IF NOT EXISTS public.agent_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('post','whatsapp','email','task','campaign','ad')),
  title text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  agent_name text,
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own proposals" ON public.agent_proposals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own proposals" ON public.agent_proposals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own proposals" ON public.agent_proposals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own proposals" ON public.agent_proposals
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_agent_proposals_user_client ON public.agent_proposals(user_id, client_id, status);

CREATE TRIGGER trg_agent_proposals_updated
  BEFORE UPDATE ON public.agent_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.client_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id text NOT NULL,
  source_proposal_id uuid REFERENCES public.agent_proposals(id) ON DELETE SET NULL,
  kind text NOT NULL,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','done','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own events" ON public.client_calendar_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own events" ON public.client_calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own events" ON public.client_calendar_events
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own events" ON public.client_calendar_events
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_client_cal_user_client_date ON public.client_calendar_events(user_id, client_id, event_date);

CREATE TRIGGER trg_client_cal_updated
  BEFORE UPDATE ON public.client_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

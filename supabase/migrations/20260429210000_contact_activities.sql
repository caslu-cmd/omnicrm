-- ── contact_activities ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_activities (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID        NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL CHECK (type IN ('note','call','email','meeting','task','stage_change','status_change','whatsapp','instagram','facebook')),
  content         TEXT,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  -- task fields
  task_due_at     TIMESTAMPTZ,
  task_done       BOOLEAN     NOT NULL DEFAULT false,
  task_done_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS contact_activities_contact_id_idx ON public.contact_activities(contact_id);
CREATE INDEX IF NOT EXISTS contact_activities_user_id_idx    ON public.contact_activities(user_id);
CREATE INDEX IF NOT EXISTS contact_activities_type_idx       ON public.contact_activities(type);
CREATE INDEX IF NOT EXISTS contact_activities_created_at_idx ON public.contact_activities(created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_contact_activity_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_contact_activities_updated_at
  BEFORE UPDATE ON public.contact_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_activity_updated_at();

-- ── Auto-update contacts.last_interaction + score ────────────────
CREATE OR REPLACE FUNCTION public.sync_contact_on_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  interaction_count INTEGER;
  new_score         INTEGER;
BEGIN
  -- Update last_interaction
  UPDATE public.contacts
  SET last_interaction = NEW.created_at
  WHERE id = NEW.contact_id
    AND (last_interaction IS NULL OR last_interaction < NEW.created_at);

  -- Recalculate score based on activity count (max 100)
  SELECT COUNT(*) INTO interaction_count
  FROM public.contact_activities
  WHERE contact_id = NEW.contact_id;

  new_score := LEAST(100, 20 + (interaction_count * 8));

  -- Boost for high-value activity types
  IF NEW.type IN ('meeting', 'call') THEN
    new_score := LEAST(100, new_score + 10);
  END IF;

  UPDATE public.contacts
  SET score = new_score
  WHERE id = NEW.contact_id;

  RETURN NEW;
END; $$;

CREATE TRIGGER trg_sync_contact_on_activity
  AFTER INSERT ON public.contact_activities
  FOR EACH ROW EXECUTE FUNCTION public.sync_contact_on_activity();

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their contact activities"
  ON public.contact_activities FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert contact activities"
  ON public.contact_activities FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their contact activities"
  ON public.contact_activities FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their contact activities"
  ON public.contact_activities FOR DELETE
  USING (user_id = auth.uid());

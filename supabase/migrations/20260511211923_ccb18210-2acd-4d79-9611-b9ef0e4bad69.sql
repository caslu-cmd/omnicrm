
ALTER TABLE public.agent_proposals
  ADD COLUMN IF NOT EXISTS titulo text,
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS agent_color text,
  ADD COLUMN IF NOT EXISTS agent_id text;

ALTER TABLE public.agent_proposals ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.agent_proposals ALTER COLUMN kind DROP NOT NULL;

ALTER TABLE public.agent_proposals DROP CONSTRAINT IF EXISTS agent_proposals_status_check;
ALTER TABLE public.agent_proposals ADD CONSTRAINT agent_proposals_status_check
  CHECK (status IN ('pending','approved','rejected','in_progress','completed'));

ALTER TABLE public.agent_proposals DROP CONSTRAINT IF EXISTS agent_proposals_kind_check;
ALTER TABLE public.agent_proposals ADD CONSTRAINT agent_proposals_kind_check
  CHECK (kind IS NULL OR kind IN ('post','whatsapp','email','task','campaign','ad','editorial'));

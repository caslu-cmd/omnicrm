-- Agentes compartilháveis — acesso público por token
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.shared_agents (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  token      TEXT    UNIQUE NOT NULL DEFAULT encode(uuid_send(gen_random_uuid()), 'hex'),
  user_id    UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id  TEXT,
  client_name TEXT,
  agent_id   TEXT    NOT NULL,
  agent_name TEXT    NOT NULL,
  agent_color TEXT   NOT NULL DEFAULT '#B9FF4B',
  agent_role TEXT,
  output     TEXT    NOT NULL,
  title      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.shared_agents ENABLE ROW LEVEL SECURITY;

-- Dono pode criar/ler/deletar os seus
CREATE POLICY "owner_shared_agents" ON public.shared_agents
  FOR ALL USING (auth.uid() = user_id);

-- Qualquer pessoa pode LER por token (página pública)
CREATE POLICY "public_read_shared_agents" ON public.shared_agents
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS shared_agents_token_idx ON public.shared_agents(token);
CREATE INDEX IF NOT EXISTS shared_agents_user_idx  ON public.shared_agents(user_id);

-- Links de agentes interativos — qualquer pessoa pode conversar sem login
CREATE TABLE IF NOT EXISTS public.agent_links (
  id            UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  token         TEXT  UNIQUE NOT NULL DEFAULT encode(uuid_send(gen_random_uuid()), 'hex'),
  user_id       UUID  REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id     TEXT,
  client_name   TEXT,
  agent_id      TEXT  NOT NULL,
  agent_name    TEXT  NOT NULL,
  agent_color   TEXT  NOT NULL DEFAULT '#B9FF4B',
  agent_role    TEXT,
  system_prompt TEXT  NOT NULL,
  welcome_msg   TEXT,
  context_note  TEXT,   -- contexto extra (ex: "foco em e-commerce", "cliente de advocacia")
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_links ENABLE ROW LEVEL SECURITY;

-- Dono pode gerenciar os seus
CREATE POLICY "owner_agent_links" ON public.agent_links
  FOR ALL USING (auth.uid() = user_id);

-- Público pode LER pelo token (para a página de chat)
CREATE POLICY "public_read_agent_links" ON public.agent_links
  FOR SELECT USING (active = true);

CREATE INDEX IF NOT EXISTS agent_links_token_idx ON public.agent_links(token);
CREATE INDEX IF NOT EXISTS agent_links_user_idx  ON public.agent_links(user_id);

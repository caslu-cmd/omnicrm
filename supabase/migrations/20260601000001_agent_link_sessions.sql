-- Sessões de uso dos links de agentes compartilhados
CREATE TABLE IF NOT EXISTS public.agent_link_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id         UUID REFERENCES public.agent_links(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email      TEXT,
  user_name       TEXT,
  messages_count  INTEGER DEFAULT 0,
  started_at      TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_link_sessions ENABLE ROW LEVEL SECURITY;

-- Dono do link pode ver todas as sessões dos seus links
CREATE POLICY "owner_see_sessions" ON public.agent_link_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agent_links al
      WHERE al.id = agent_link_sessions.link_id
        AND al.user_id = auth.uid()
    )
  );

-- Usuário autenticado pode inserir/atualizar sua própria sessão
CREATE POLICY "user_insert_session" ON public.agent_link_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_update_session" ON public.agent_link_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS sessions_link_idx ON public.agent_link_sessions(link_id);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON public.agent_link_sessions(user_id);

-- Tabela de formulários de captura de leads
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{"title":"","button_text":"Enviar","success_message":"Obrigado! Entraremos em contato.","source":"formulario"}',
  active BOOLEAN DEFAULT true,
  submissions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_forms" ON public.forms
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS forms_user_id_idx ON public.forms(user_id);
CREATE INDEX IF NOT EXISTS forms_client_id_idx ON public.forms(client_id);

-- Contagem de submissions via trigger
CREATE OR REPLACE FUNCTION increment_form_submissions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forms SET submissions_count = submissions_count + 1 WHERE id = NEW.form_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

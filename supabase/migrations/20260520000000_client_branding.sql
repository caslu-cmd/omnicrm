-- Branding por cliente para telas públicas (ex: lista de presença)
CREATE TABLE public.client_branding (
  client_id        text PRIMARY KEY,
  logo_url         text,
  instagram_handle text,
  primary_color    text DEFAULT '#B9FF4B',
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.client_branding ENABLE ROW LEVEL SECURITY;

-- Leitura pública (necessário para páginas sem autenticação)
CREATE POLICY "Public read client_branding"
  ON public.client_branding FOR SELECT USING (true);

-- Escrita apenas para usuários autenticados
CREATE POLICY "Authenticated manage client_branding"
  ON public.client_branding FOR ALL USING (auth.role() = 'authenticated');

-- Dados iniciais: Grupo Licita
INSERT INTO public.client_branding (client_id, instagram_handle, primary_color)
VALUES ('grupo-licita', 'grupolicita', '#B9FF4B');

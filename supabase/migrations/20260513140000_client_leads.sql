-- Pipeline routing fields on webhook endpoints
ALTER TABLE webhook_endpoints
  ADD COLUMN IF NOT EXISTS pipeline_id TEXT,
  ADD COLUMN IF NOT EXISTS initial_stage_id TEXT;

-- client_leads: kanban leads por cliente e pipeline
CREATE TABLE IF NOT EXISTS client_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,

  -- Campos comuns
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  value TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Campos Usineiro
  cnpj TEXT,
  potencia_kw TEXT,
  distribuidora TEXT,

  -- Campos Associado
  uc TEXT,
  consumo_medio TEXT,
  metodo TEXT,

  -- Origem
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'webhook' | 'import'
  webhook_endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE client_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_client_leads" ON client_leads
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_client_leads_client    ON client_leads(client_id);
CREATE INDEX IF NOT EXISTS idx_client_leads_pipeline  ON client_leads(client_id, pipeline_id);

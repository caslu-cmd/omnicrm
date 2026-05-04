-- Webhook endpoints per client
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  field_mappings JSONB NOT NULL DEFAULT '{}',
  course_name TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Log of incoming leads via webhook
CREATE TABLE webhook_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE CASCADE NOT NULL,
  client_id TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  raw_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_webhook_endpoints" ON webhook_endpoints
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "owner_webhook_leads" ON webhook_leads
  FOR ALL USING (
    webhook_endpoint_id IN (
      SELECT id FROM webhook_endpoints WHERE user_id = auth.uid()
    )
  );

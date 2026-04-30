-- Add client_id to contacts so they can be scoped per client workspace
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS client_id TEXT;
CREATE INDEX IF NOT EXISTS contacts_client_id_idx ON public.contacts(client_id);
